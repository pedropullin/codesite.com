import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>shadcn/ui está funcionando</CardTitle>
          <CardDescription>
            Projeto configurado com Next.js, Tailwind e shadcn/ui. O registry
            do 21st.dev já está declarado em <code>components.json</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use <code>npx shadcn@latest add [componente]</code> para adicionar
            mais componentes, ou puxe do 21st.dev com{" "}
            <code>npx shadcn@latest add @21st-dev/[nome]</code>.
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button>Primário</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
