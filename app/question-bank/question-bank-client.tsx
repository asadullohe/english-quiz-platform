import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type BankLevel = {
  id: string;
  name: string;
};

export type BankCategory = {
  id: string;
  name: string;
};

export type BankOption = {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  order_index: number;
};

export type BankTextAnswer = {
  id: string;
  question_id: string;
  answer_text: string;
};

export type BankQuestion = {
  id: string;
  prompt: string;
  explanation: string | null;
  answer_type: "single_choice" | "text";
  visibility: "public" | "group_only";
  levelName: string;
  categoryName: string;
  groupName: string;
  assignmentTitle: string;
  creatorName: string;
  approvedAt: string | null;
  hasImage: boolean;
  hasAudio: boolean;
  isOwn: boolean;
  tags: string[];
  options: BankOption[];
  textAnswers: BankTextAnswer[];
};

type FilterValue = {
  categoryId: string;
  levelId: string;
  query: string;
  visibility: string;
};

function AnswerPreview({ question }: { question: BankQuestion }) {
  if (question.answer_type === "text") {
    return (
      <div className="grid gap-2">
        {question.textAnswers.map((answer) => (
          <div className="rounded-xl border bg-muted/40 px-3 py-2 text-sm" key={answer.id}>
            {answer.answer_text}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {question.options
        .slice()
        .sort((left, right) => left.order_index - right.order_index)
        .map((option) => (
          <div
            className={
              option.is_correct
                ? "rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-bold text-primary"
                : "rounded-xl border bg-muted/40 px-3 py-2 text-sm"
            }
            key={option.id}
          >
            {option.text}
          </div>
        ))}
    </div>
  );
}

export function QuestionBankClient({
  categories,
  filters,
  levels,
  questions,
}: {
  categories: BankCategory[];
  filters: FilterValue;
  levels: BankLevel[];
  questions: BankQuestion[];
}) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Filterlar</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[1fr_190px_190px_170px_auto]">
            <Input defaultValue={filters.query} name="q" placeholder="Prompt yoki tag qidirish" />
            <select
              className="h-11 rounded-xl border bg-background px-3 text-sm font-semibold"
              defaultValue={filters.levelId}
              name="level"
            >
              <option value="">Barcha levellar</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
            <select
              className="h-11 rounded-xl border bg-background px-3 text-sm font-semibold"
              defaultValue={filters.categoryId}
              name="category"
            >
              <option value="">Barcha category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              className="h-11 rounded-xl border bg-background px-3 text-sm font-semibold"
              defaultValue={filters.visibility}
              name="visibility"
            >
              <option value="">Visibility</option>
              <option value="public">Public</option>
              <option value="group_only">Group only</option>
            </select>
            <div className="flex gap-2">
              <Button type="submit">Filter</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/question-bank">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {questions.map((question) => (
          <Card key={question.id}>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>{question.prompt}</CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {question.levelName} / {question.categoryName} / {question.groupName}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-muted px-3 py-2 text-xs font-bold uppercase text-muted-foreground">
                    {question.answer_type}
                  </span>
                  <span className="rounded-full bg-secondary px-3 py-2 text-xs font-bold uppercase text-secondary-foreground">
                    {question.visibility}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <AnswerPreview question={question} />

              {question.explanation ? (
                <div className="rounded-2xl border p-4 text-sm">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Explanation</p>
                  <p className="mt-2">{question.explanation}</p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full border px-3 py-1">
                  Source: {question.assignmentTitle}
                </span>
                <span className="rounded-full border px-3 py-1">
                  Creator: {question.creatorName}
                </span>
                {question.isOwn ? <span className="rounded-full border px-3 py-1">Own</span> : null}
                {question.hasImage ? (
                  <span className="rounded-full border px-3 py-1">Image</span>
                ) : null}
                {question.hasAudio ? (
                  <span className="rounded-full border px-3 py-1">Audio</span>
                ) : null}
                {question.approvedAt ? (
                  <span className="rounded-full border px-3 py-1">
                    Approved {new Date(question.approvedAt).toLocaleDateString("uz-UZ")}
                  </span>
                ) : null}
              </div>

              {question.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag) => (
                    <span
                      className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}

        {questions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Approved savol topilmadi.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}
