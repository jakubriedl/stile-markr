import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { PageHeading, SectionHeading } from "./Heading.tsx";

function PageAndSectionHeadings() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeading>Upload exam results</PageHeading>
      <SectionHeading>Score histogram</SectionHeading>
    </div>
  );
}

const meta = {
  title: "Components/Heading",
  component: PageAndSectionHeadings,
} satisfies Meta<typeof PageAndSectionHeadings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PageAndSection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(
      canvas.getByRole("heading", { level: 1, name: "Upload exam results" }),
    ).toBeInTheDocument();
    expect(canvas.getByRole("heading", { level: 2, name: "Score histogram" })).toBeInTheDocument();
  },
};
