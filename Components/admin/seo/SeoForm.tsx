"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SeoPage, SeoSettings } from "@prisma/client";

import {
  updateSeoPage,
  updateSeoSettings,
} from "@/lib/actions/seo.actions";

import FormActions from "@/components/admin/common/FormActions";
import SwitchField from "@/components/admin/fields/SwitchField";
import TextAreaField from "@/components/admin/fields/TextAreaField";
import TextField from "@/components/admin/fields/TextField";
import AdminSection from "@/components/admin/layout/AdminSection";
import MediaPicker from "@/components/admin/media/MediaPicker";
import GooglePreview from "@/components/admin/seo/GooglePreview";
import OpenGraphPreview from "@/components/admin/seo/OpenGraphPreview";
import { Messages } from "@/lib/messages";
import { notify } from "@/lib/toast";

interface SeoFormProps {
  mode: "settings" | "page";
  settings?: SeoSettings;
  page?: SeoPage;
  siteUrl?: string;
  siteName?: string;
}

export default function SeoForm({
  mode,
  settings,
  page,
  siteUrl = "https://example.com",
  siteName = "Website",
}: SeoFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [previewTitle, setPreviewTitle] = useState(page?.title ?? "");
  const [previewDescription, setPreviewDescription] = useState(
    page?.description ?? ""
  );
  const [previewCanonicalUrl, setPreviewCanonicalUrl] = useState(
    page?.canonicalUrl ?? ""
  );
  const [previewOgTitle, setPreviewOgTitle] = useState(page?.ogTitle ?? "");
  const [previewOgDescription, setPreviewOgDescription] = useState(
    page?.ogDescription ?? ""
  );
  const [previewOgImage, setPreviewOgImage] = useState(page?.ogImage ?? "");

  async function handleSubmit(formData: FormData) {
    setErrorMessage(null);

    try {
      if (mode === "settings") {
        await updateSeoSettings(formData);
      } else {
        if (!page) {
          throw new Error("SEO page not found.");
        }

        await updateSeoPage(page.pageKey, formData);
      }

      notify.success(Messages.saved);
      router.push("/admin/seo");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : Messages.saveFailed;

      setErrorMessage(message);
      notify.error(message);
    }
  }

  if (mode === "settings" && !settings) {
    return null;
  }

  if (mode === "page" && !page) {
    return null;
  }

  const googleUrl =
    previewCanonicalUrl ||
    `${siteUrl}${page?.pageKey === "home" ? "/" : `/${page?.pageKey ?? ""}`}`;

  return (
    <form action={handleSubmit} className="space-y-8 rounded-xl bg-white p-6 shadow sm:p-8">
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {mode === "settings" ? (
        <>
          <AdminSection
            title="Global SEO"
            description="Default metadata used across your website."
          >
            <div className="grid gap-6 py-6 md:grid-cols-2">
              <TextField
                label="Site Name"
                name="siteName"
                required
                maxLength={120}
                defaultValue={settings?.siteName ?? ""}
              />

              <TextField
                label="Site URL"
                name="siteUrl"
                type="url"
                required
                maxLength={500}
                defaultValue={settings?.siteUrl ?? ""}
              />

              <TextField
                label="Default Title"
                name="defaultTitle"
                required
                maxLength={120}
                defaultValue={settings?.defaultTitle ?? ""}
              />

              <TextField
                label="Default Keywords"
                name="defaultKeywords"
                maxLength={500}
                defaultValue={settings?.defaultKeywords ?? ""}
              />

              <div className="md:col-span-2">
                <TextAreaField
                  label="Default Description"
                  name="defaultDescription"
                  required
                  rows={4}
                  maxLength={320}
                  defaultValue={settings?.defaultDescription ?? ""}
                />
              </div>
            </div>
          </AdminSection>

          <AdminSection
            title="Open Graph and Branding"
            description="Images and brand assets used in social previews."
          >
            <div className="grid gap-6 py-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <MediaPicker
                  label="Default OG Image"
                  name="defaultOgImage"
                  type="IMAGE"
                  defaultValue={settings?.defaultOgImage ?? ""}
                  helperText="Used as a fallback image when page-level OG image is not set."
                />
              </div>

              <MediaPicker
                label="Favicon"
                name="favicon"
                type="IMAGE"
                defaultValue={settings?.favicon ?? ""}
              />

              <MediaPicker
                label="Apple Touch Icon"
                name="appleTouchIcon"
                type="IMAGE"
                defaultValue={settings?.appleTouchIcon ?? ""}
              />

              <TextField
                label="Twitter Handle"
                name="twitterHandle"
                maxLength={100}
                defaultValue={settings?.twitterHandle ?? ""}
              />

              <TextField
                label="Facebook App ID"
                name="facebookAppId"
                maxLength={100}
                defaultValue={settings?.facebookAppId ?? ""}
              />
            </div>
          </AdminSection>

          <AdminSection
            title="Robots and Verification"
            description="Search indexing behavior and verification tokens."
          >
            <div className="space-y-6 py-6">
              <div className="grid gap-6 md:grid-cols-2">
                <SwitchField
                  label="Robots Index"
                  name="robotsIndex"
                  text="Allow indexing"
                  defaultChecked={settings?.robotsIndex ?? true}
                />

                <SwitchField
                  label="Robots Follow"
                  name="robotsFollow"
                  text="Allow link following"
                  defaultChecked={settings?.robotsFollow ?? true}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <TextField
                  label="Google Verification"
                  name="googleVerification"
                  maxLength={255}
                  defaultValue={settings?.googleVerification ?? ""}
                />

                <TextField
                  label="Bing Verification"
                  name="bingVerification"
                  maxLength={255}
                  defaultValue={settings?.bingVerification ?? ""}
                />
              </div>
            </div>
          </AdminSection>

          <FormActions cancelHref="/admin/seo" submitLabel="Save Settings" />
        </>
      ) : (
        <div className="grid gap-8 xl:grid-cols-3">
          <div className="space-y-8 xl:col-span-2">
            <AdminSection
              title="Page Metadata"
              description="Search metadata for this page."
            >
              <div className="grid gap-6 py-6 md:grid-cols-2">
                <TextField
                  label="Title"
                  name="title"
                  required
                  maxLength={120}
                  defaultValue={page?.title ?? ""}
                  onChange={(event) => setPreviewTitle(event.target.value)}
                />

                <TextField
                  label="Keywords"
                  name="keywords"
                  maxLength={500}
                  defaultValue={page?.keywords ?? ""}
                />

                <div className="md:col-span-2">
                  <TextAreaField
                    label="Description"
                    name="description"
                    required
                    rows={4}
                    maxLength={320}
                    defaultValue={page?.description ?? ""}
                    onChange={(event) =>
                      setPreviewDescription(event.target.value)
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <TextField
                    label="Canonical URL"
                    name="canonicalUrl"
                    type="url"
                    maxLength={500}
                    defaultValue={page?.canonicalUrl ?? ""}
                    onChange={(event) =>
                      setPreviewCanonicalUrl(event.target.value)
                    }
                  />
                </div>
              </div>
            </AdminSection>

            <AdminSection
              title="Open Graph"
              description="Social preview metadata for sharing links."
            >
              <div className="grid gap-6 py-6 md:grid-cols-2">
                <TextField
                  label="OG Title"
                  name="ogTitle"
                  maxLength={120}
                  defaultValue={page?.ogTitle ?? ""}
                  onChange={(event) => setPreviewOgTitle(event.target.value)}
                />

                <div className="md:col-span-2">
                  <MediaPicker
                    label="OG Image"
                    name="ogImage"
                    type="IMAGE"
                    defaultValue={page?.ogImage ?? ""}
                    helperText="Select an image from Media Library for social sharing previews."
                    onPick={(item) => setPreviewOgImage(item.url)}
                  />
                </div>

                <div className="md:col-span-2">
                  <TextAreaField
                    label="OG Description"
                    name="ogDescription"
                    rows={3}
                    maxLength={320}
                    defaultValue={page?.ogDescription ?? ""}
                    onChange={(event) =>
                      setPreviewOgDescription(event.target.value)
                    }
                  />
                </div>
              </div>
            </AdminSection>

            <AdminSection
              title="Robots"
              description="Control search indexing behavior for this page."
            >
              <div className="grid gap-6 py-6 md:grid-cols-2">
                <SwitchField
                  label="Robots Index"
                  name="robotsIndex"
                  text="Allow indexing"
                  defaultChecked={page?.robotsIndex ?? true}
                />

                <SwitchField
                  label="Robots Follow"
                  name="robotsFollow"
                  text="Allow link following"
                  defaultChecked={page?.robotsFollow ?? true}
                />
              </div>
            </AdminSection>

            <FormActions cancelHref="/admin/seo" submitLabel="Save" />
          </div>

          <div className="space-y-6">
            <GooglePreview
              title={previewTitle || page?.title || ""}
              url={googleUrl}
              description={previewDescription || page?.description || ""}
            />

            <OpenGraphPreview
              image={previewOgImage || page?.ogImage || ""}
              title={previewOgTitle || previewTitle || page?.title || ""}
              description={
                previewOgDescription ||
                previewDescription ||
                page?.description ||
                ""
              }
              siteName={siteName}
            />
          </div>
        </div>
      )}
    </form>
  );
}
