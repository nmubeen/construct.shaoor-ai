"use client";

import React from "react";
import Card from "../primitives/Card";

interface Props {
  children: React.ReactNode;
}

export default function DataTable({
  children,
}: Props) {
  return (
    <Card className="overflow-hidden">

      <div className="overflow-x-auto">

        <table className="min-w-full divide-y divide-slate-200">

          {children}

        </table>

      </div>

    </Card>
  );
}