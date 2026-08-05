import { handlers } from "../../../../../auth";
// Note: this relative path assumes this file lives at
// src/app/api/auth/[...nextauth]/route.ts. If VS Code's auto-import
// or a red underline complains, right-click "auth.ts" in your editor
// and "Copy Relative Path" from this exact file to double check the
// number of "../" needed matches your folder depth.
 
export const { GET, POST } = handlers;