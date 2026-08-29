"use client";

import React from "react";

interface Props {
  search?: React.ReactNode;
  action?: React.ReactNode;
}

export default function TableToolbar({
  search,
  action,
}: Props) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

      <div>
        {search}
      </div>

      <div>
        {action}
      </div>

    </div>
  );
}