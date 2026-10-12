import { redirect } from "next/navigation";

// Clients and scribes arrive on their own token links; the root is only ever the team's way in.
export default function Home() {
  redirect("/admin");
}
