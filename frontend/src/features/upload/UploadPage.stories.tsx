import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, fn, userEvent, waitFor, within } from "storybook/test";

import { withAppShell } from "../../storybook/withAppShell.tsx";
import { UploadPage } from "./UploadPage.tsx";

const meta = {
  title: "Pages/Upload",
  component: UploadPage,
  decorators: [withAppShell("/")],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    onUpload: fn(async () => ({ imported: 2, test_ids: ["9863", "exam-a"] })),
  },
} satisfies Meta<typeof UploadPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Prefer change events so FileTrigger accept filters do not block invalid-type stories. */
function selectFile(canvasElement: HTMLElement, file: File) {
  const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]');
  if (input == null) {
    throw new Error("Expected FileTrigger to render a file input");
  }
  fireEvent.change(input, { target: { files: [file] } });
}

async function waitForPage(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await waitFor(() => {
    expect(canvas.getByRole("heading", { name: "Upload exam results" })).toBeInTheDocument();
  });
  return canvas;
}

export const Ready: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await waitForPage(canvasElement);
    expect(canvas.getByRole("link", { name: "Import" })).toHaveAttribute("aria-current", "page");
    expect(
      canvas.getByRole("button", { name: "Results XML file. No file selected" }),
    ).toBeInTheDocument();
    // Long instruction is visual-only; must not be the DropZone accessible name.
    expect(
      canvas.queryByRole("button", {
        name: /Drop a results XML file here/,
      }),
    ).toBeNull();
    expect(canvas.getByRole("button", { name: "Choose file" })).toBeInTheDocument();
    expect(canvas.getByRole("button", { name: "Upload" })).toBeDisabled();
    expect(canvas.queryByRole("link", { name: "View tests" })).not.toBeInTheDocument();
  },
};

export const InvalidType: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await waitForPage(canvasElement);
    selectFile(canvasElement, new File(["nope"], "notes.txt", { type: "text/plain" }));
    expect(canvas.getByRole("alert")).toHaveTextContent("Selected file must be XML.");
    expect(canvas.getByRole("button", { name: "Upload" })).toBeDisabled();
  },
};

export const Oversized: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await waitForPage(canvasElement);
    selectFile(
      canvasElement,
      new File([new Uint8Array(52_428_801)], "huge.xml", { type: "text/xml" }),
    );
    expect(canvas.getByRole("alert")).toHaveTextContent("Selected file must not exceed 50 MiB.");
    expect(canvas.getByRole("button", { name: "Upload" })).toBeDisabled();
  },
};

export const Uploading: Story = {
  args: {
    onUpload: fn(() => new Promise(() => {})),
  },
  play: async ({ canvasElement }) => {
    const canvas = await waitForPage(canvasElement);
    selectFile(canvasElement, new File(["<results />"], "results.xml", { type: "text/xml" }));
    await userEvent.click(canvas.getByRole("button", { name: "Upload" }));
    await waitFor(() => {
      expect(canvas.getByRole("button", { name: "Uploading…" })).toBeDisabled();
    });
  },
};

export const SuccessWithTestLinks: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = await waitForPage(canvasElement);
    const xmlFile = new File(["<results />"], "results.xml", { type: "text/xml" });
    selectFile(canvasElement, xmlFile);
    await userEvent.click(canvas.getByRole("button", { name: "Upload" }));

    const status = await canvas.findByRole("status");
    expect(status).toHaveTextContent("Imported 2 unique results.");
    expect(canvas.getByRole("link", { name: "Test 9863" })).toHaveAttribute("href", "/tests/9863");
    expect(canvas.getByRole("link", { name: "Test exam-a" })).toHaveAttribute(
      "href",
      "/tests/exam-a",
    );
    expect(args.onUpload).toHaveBeenCalledWith(xmlFile);
  },
};

export const ServerReject: Story = {
  args: {
    onUpload: fn(async () => {
      throw new Error("Import capacity exceeded");
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = await waitForPage(canvasElement);
    selectFile(canvasElement, new File(["<results />"], "results.xml", { type: "text/xml" }));
    await userEvent.click(canvas.getByRole("button", { name: "Upload" }));
    await waitFor(() => {
      expect(canvas.getByRole("alert")).toHaveTextContent("Import capacity exceeded");
    });
  },
};
