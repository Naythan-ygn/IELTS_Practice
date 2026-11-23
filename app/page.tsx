import SprintApp from "@/components/sprint-app";
import { authenticatedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { catalog } from "@/lib/strategy-service";
import { strategyCourse } from "@/lib/strategy-course";
import { publicActivities, course, words, writingPrompts, speakingSets, } from "@/lib/content";
export default async function Page() {
    if (!(await authenticatedUser()))
        redirect("/login");
    return (<SprintApp content={{
            activities: publicActivities(),
            course: strategyCourse,
            words,
            writingPrompts,
            speakingSets,
            strategyCatalog: catalog(),
        }}/>);
}
