"use client";

import { useCallback } from "react";

import { useContextualFlags } from "./useContextualFlags";

export function useProjectLifecycle() {
  const { flagCreatedProject, flagDeletedProject, getProjectCount } = useContextualFlags();
  const createProject = useCallback(
    (name: string) => {
      flagCreatedProject();
      return { name };
    },
    [flagCreatedProject]
  );
  const deleteProject = useCallback(
    (id: string) => {
      flagDeletedProject();
      return { id };
    },
    [flagDeletedProject]
  );

  return { createProject, deleteProject, getProjectCount };
}
