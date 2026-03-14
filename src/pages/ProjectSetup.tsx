import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bot, Key, Settings, CheckCircle, AlertCircle, Copy, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProjectSetup() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [projectId, setProjectId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveConfig = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Configuração salva",
        description: "As credenciais do projeto foram atualizadas com sucesso.",
      });
    }, 1000);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText("sk-ant-api-...");
    toast({
      title: "Chave copiada",
      description: "A chave de API foi copiada para a área de transferência.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuração do Projeto</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações do Ecossistema Anthropic
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Bot className="h-3 w-3" />
          Anthropic
        </Badge>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="integration">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Informações do Projeto
              </CardTitle>
              <CardDescription>
                Configure os dados básicos do seu projeto no ecossistema Anthropic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Nome do Projeto</Label>
                <Input id="project-name" placeholder="Meu Projeto Anthropic" defaultValue="Oportunidade Infinitas" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-id">ID do Projeto</Label>
                <Input id="project-id" value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="ozmwiwypbjtjegborfhs" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="environment">Ambiente</Label>
                <Input id="environment" defaultValue="Produção" disabled />
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm text-muted-foreground">Projeto conectado ao ecossistema Anthropic</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Chaves de API
              </CardTitle>
              <CardDescription>
                Gerencie as chaves de API para integração com serviços Anthropic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">Anthropic API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-ant-api-..."
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopyKey}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/50 p-3">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Segurança</p>
                  <p>Nunca compartilhe sua chave de API publicamente. Ela concede acesso total ao seu projeto.</p>
                </div>
              </div>
              <Button onClick={handleSaveConfig} disabled={isLoading} className="gap-2">
                {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrações Ativas</CardTitle>
              <CardDescription>
                Serviços conectados ao seu projeto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Supabase Backend</p>
                      <p className="text-xs text-muted-foreground">ozmwiwypbjtjegborfhs</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-success">Conectado</Badge>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Anthropic AI</p>
                      <p className="text-xs text-muted-foreground">Claude API</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-success">Conectado</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
