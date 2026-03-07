import { redirect } from "next/navigation";

export default function ServiceSettingsIndex() {
    redirect("/settings/service/categories");
}
