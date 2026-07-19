import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { UploadPage } from "./UploadPage.tsx";

const meta = {
  title: "Pages/Upload",
  component: UploadPage,
  args: {
    onUpload: fn(async () => ({ imported: 2, test_ids: ["9863", "exam-a"] })),
  },
} satisfies Meta<typeof UploadPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const RejectingUpload: Story = {
  args: {
    onUpload: fn(async () => {
      throw new Error("Invalid XML format");
    }),
  },
};
