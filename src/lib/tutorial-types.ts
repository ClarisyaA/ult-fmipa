export type TutorialMode = "admin" | "page";

export type TutorialStep = {
  title: string;
  body: string;
  route?: string;
  target?: string;
  ctaLabel?: string;
  onCta?:
    | "open-first-request-preview"
    | "open-user-create-form"
    | "open-user-reset-password"
    | "navigate";
  previewService?: string;
};
