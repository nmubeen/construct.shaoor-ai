import "server-only";

import { Prisma } from "@prisma/construct-client";
import { getConstructPrisma } from "@/lib/construct-prisma";

export type ConstructCommercialAccess = {
  subscriptionId: string;
  accountName: string;
  planCode: string;
  planName: string;
  status: string;
  provisioningStatus: string;
  periodEnd: Date | null;
  accessAllowed: boolean;
};
export type ConstructEntitlement={featureCode:string;valueType:"BOOLEAN"|"NUMBER";booleanValue:boolean|null;numericValue:number|null};
export type ConstructPlanUsage={access:ConstructCommercialAccess;items:Array<{featureCode:string;label:string;used:number;limit:number}>;customDomain:boolean};
export class ConstructEntitlementError extends Error { constructor(message:string){super(message);this.name="ConstructEntitlementError";} }

export async function getConstructCommercialAccess(organizationId: string): Promise<ConstructCommercialAccess | null> {
  try {
    const rows = await getConstructPrisma().$queryRaw<ConstructCommercialAccess[]>(Prisma.sql`
      SELECT s.id AS "subscriptionId", account.name AS "accountName", plan.code AS "planCode",
        plan.name AS "planName", s.status::text, instance.provisioning_status::text AS "provisioningStatus",
        s.current_period_end AS "periodEnd",
        ((s.status IN ('TRIALING','ACTIVE','PAST_DUE') OR (s.status='CANCELLED' AND s.current_period_end>now()))
          AND instance.provisioning_status='READY') AS "accessAllowed"
      FROM control.product_instances instance
      JOIN control.products product ON product.id=instance.product_id AND product.code='SHAOOR_CONSTRUCT'
      JOIN control.accounts account ON account.id=instance.account_id
      JOIN control.subscriptions s ON s.id=instance.subscription_id
      JOIN control.plans plan ON plan.id=s.plan_id
      WHERE instance.tenant_schema='construct' AND instance.tenant_organization_id=${organizationId}::uuid
      LIMIT 1
    `);
    return rows[0] ?? null;
  } catch {
    // Allows Construct to run before the shared-control migration is deployed.
    return null;
  }
}

export async function getConstructEntitlements(organizationId:string):Promise<{access:ConstructCommercialAccess;entitlements:ConstructEntitlement[]}|null>{
 const access=await getConstructCommercialAccess(organizationId);if(!access)return null;
 const entitlements=await getConstructPrisma().$queryRaw<ConstructEntitlement[]>(Prisma.sql`
  SELECT base.feature_code "featureCode",base.value_type::text "valueType",
   CASE WHEN base.value_type<>'BOOLEAN' THEN NULL WHEN override.id IS NULL THEN base.boolean_value WHEN override.mode='RESTRICT' THEN base.boolean_value AND override.boolean_value ELSE override.boolean_value END "booleanValue",
   CASE WHEN base.value_type<>'NUMBER' THEN NULL WHEN override.id IS NULL THEN base.numeric_value WHEN override.mode='ADD' THEN base.numeric_value+override.numeric_value WHEN override.mode='RESTRICT' THEN LEAST(base.numeric_value,override.numeric_value) ELSE override.numeric_value END "numericValue"
  FROM control.product_instances instance JOIN control.subscriptions subscription ON subscription.id=instance.subscription_id JOIN control.plan_entitlements base ON base.plan_id=subscription.plan_id
  LEFT JOIN LATERAL(SELECT item.* FROM control.subscription_entitlement_overrides item WHERE item.subscription_id=subscription.id AND item.feature_code=base.feature_code AND item.effective_from<=now() AND(item.effective_until IS NULL OR item.effective_until>now()) ORDER BY item.effective_from DESC LIMIT 1) override ON true
  WHERE instance.tenant_schema='construct' AND instance.tenant_organization_id=${organizationId}::uuid
 `);return{access,entitlements};
}
export async function enforceConstructAccess(organizationId:string){const state=await getConstructEntitlements(organizationId);if(state&&!state.access.accessAllowed)throw new ConstructEntitlementError(`Your ${state.access.planName} subscription is ${state.access.status.toLowerCase()} and does not currently permit changes.`);return state;}
export async function enforceConstructNumericLimit(organizationId:string,featureCode:string,currentCount:number){const state=await enforceConstructAccess(organizationId);if(!state)return;const item=state.entitlements.find(value=>value.featureCode===featureCode&&value.valueType==="NUMBER");if(!item||item.numericValue===null)throw new ConstructEntitlementError(`${featureCode.replaceAll("_"," ")} is not available on this plan.`);if(currentCount>=item.numericValue)throw new ConstructEntitlementError(`${state.access.planName} allows ${item.numericValue} ${featureCode.replace(/^MAX_/,"").toLowerCase().replaceAll("_"," ")}. Upgrade the subscription or remove an existing item.`);}
export async function enforceConstructBooleanEntitlement(organizationId:string,featureCode:string){const state=await enforceConstructAccess(organizationId);if(!state)return;const item=state.entitlements.find(value=>value.featureCode===featureCode&&value.valueType==="BOOLEAN");if(!item?.booleanValue)throw new ConstructEntitlementError(`${featureCode.replaceAll("_"," ").toLowerCase()} is not included in ${state.access.planName}.`);}

export async function getConstructPlanUsage(organizationId:string):Promise<ConstructPlanUsage|null>{
 const state=await getConstructEntitlements(organizationId);if(!state)return null;const prisma=getConstructPrisma();
 const [projects,members,pendingInvitations,media]=await Promise.all([prisma.project.count({where:{organizationId}}),prisma.membership.count({where:{organizationId}}),prisma.invitation.count({where:{organizationId,status:"PENDING",expiresAt:{gt:new Date()}}}),prisma.media.count({where:{organizationId}})]);
 const current:Record<string,number>={MAX_PROJECTS:projects,MAX_TEAM_MEMBERS:members+pendingInvitations,MAX_MEDIA_ITEMS:media};
 const labels:Record<string,string>={MAX_PROJECTS:"Projects",MAX_TEAM_MEMBERS:"Team seats",MAX_MEDIA_ITEMS:"Media items"};
 const items=state.entitlements.filter(item=>item.valueType==="NUMBER"&&item.numericValue!==null&&item.featureCode in current).map(item=>({featureCode:item.featureCode,label:labels[item.featureCode],used:current[item.featureCode],limit:item.numericValue!}));
 return{access:state.access,items,customDomain:Boolean(state.entitlements.find(item=>item.featureCode==="CUSTOM_DOMAIN")?.booleanValue)};
}
