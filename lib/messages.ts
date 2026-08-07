export const Entity = {
  project: "Project",
  service: "Service",
  team: "Team Member",
  client: "Client",
  testimonial: "Testimonial",
  message: "Message",
  faq: "FAQ",
  media: "Media",
  gallery: "Gallery",
  highlight: "Highlight",
  galleryImage: "Gallery image",
  settings: "Settings",
} as const;

type EntityKey = keyof typeof Entity;
type EntityName = (typeof Entity)[EntityKey];
type Entity = EntityKey | EntityName;

function entityLabel(entity: Entity) {
  return entity in Entity ? Entity[entity as EntityKey] : entity;
}

export const Messages = {
  // Generic CRUD
  created: (entity: Entity) =>
    `${entityLabel(entity)} created successfully.`,
  updated: (entity: Entity) =>
    `${entityLabel(entity)} updated successfully.`,
  deleted: (entity: Entity) =>
    `${entityLabel(entity)} deleted successfully.`,

  // Save
  saved: "Changes saved successfully.",
  saveFailed: "Unable to save changes.",

  // Delete
  deleteFailed: "Unable to delete item.",

  // Upload
  uploadStarted: "Uploading file...",
  uploadSuccess: "File uploaded successfully.",
  uploadFailed: "File upload failed.",

  // Validation
  validation: "Please correct the highlighted fields.",

  // Authentication
  loginSuccess: "Welcome back!",
  loginFailed: "Invalid username or password.",
  logoutSuccess: "You have been logged out.",

  // Generic
  unexpected: "Something went wrong. Please try again.",
};
