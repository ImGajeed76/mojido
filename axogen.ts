import { defineConfig, cmd, group, liveExec } from "@axonotes/axogen";
import { throwIfToolMissing } from "./axogen/utils/tool-detection";
import { ensureAndroidEnv } from "./axogen/utils/android-env";
import { generateSentences } from "./axogen/scripts/generate-sentences";

export default defineConfig({
  commands: {
    dev: cmd({
      help: "Start Mojido development server",
      exec: async () => {
        await throwIfToolMissing("Bun", "bun", "--version", "https://bun.sh/");
        await throwIfToolMissing(
          "Cargo",
          "cargo",
          "--version",
          "https://rustup.rs/"
        );

        const isLinux = process.platform === "linux";
        const prefix = isLinux ? "WEBKIT_DISABLE_DMABUF_RENDERER=1 " : "";

        await liveExec(`${prefix}bunx tauri dev`, { outputPrefix: "DEV" });
      },
    }),

    build: cmd({
      help: "Build Mojido for production",
      exec: async () => {
        await throwIfToolMissing("Bun", "bun", "--version", "https://bun.sh/");
        await liveExec("bunx tauri build", { outputPrefix: "BUILD" });
      },
    }),

    android: group({
      help: "Android commands",
      commands: {
        dev: cmd({
          help: "Start Android development",
          exec: async () => {
            await ensureAndroidEnv();
            await liveExec("bunx tauri android dev", {
              outputPrefix: "ANDROID",
            });
          },
        }),
        build: cmd({
          help: "Build Android APK",
          exec: async () => {
            await ensureAndroidEnv();
            await liveExec("bunx tauri android build", {
              outputPrefix: "ANDROID",
            });
          },
        }),
      },
    }),

    fmt: cmd({
      help: "Format the codebase",
      exec: async () => {
        await liveExec("bunx prettier -w .", { outputPrefix: "PRETTIER" });
      },
    }),

    generate: cmd({
      help: "Generate sentences from Tatoeba data",
      exec: generateSentences,
    }),
  },
});
