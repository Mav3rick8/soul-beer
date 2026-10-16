import { PageShell } from "@/components/PageShell";
import { CancelForm } from "./cancel-form";

export default function CancelPage({ params }: { params: { token: string } }) {
  return (
    <PageShell title="Отмена брони">
      <CancelForm token={params.token} />
    </PageShell>
  );
}
