import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Building2, TrendingUp, Users, Zap, Globe, Trophy } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="absolute inset-0">
          {/* Organic shapes */}
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-32 left-16 w-80 h-80 bg-gradient-to-tr from-orange-300/30 to-transparent rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 border border-white/30 mb-8">
              <Zap className="w-4 h-4 mr-2 text-white" />
              <span className="text-sm font-medium text-white">Future of Startup Trading</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Startup Stock
              <br />
              <span className="text-white/90">Market</span>
            </h1>
            
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
              A revolucionária plataforma de trading para eventos onde fundadores vendem ações das suas startups a investidores anjos e VCs num mercado dinâmico e interativo.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-orange-600 hover:bg-gray-50 px-8 py-6 text-lg h-14 font-semibold shadow-lg">
                <Link to="/auth">
                  Começar Agora
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="px-8 py-6 text-lg h-14 border-white/30 text-white hover:bg-white/10">
                <Link to="/auth">
                  Entrar na Plataforma
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20 bg-gray-50">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            O Futuro do <span className="text-orange-600">Investment Gaming</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Uma experiência imersiva que combina networking, investimento e gamificação num ambiente controlado e educativo.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="bg-white border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Trading em Tempo Real</h3>
              <p className="text-gray-600">
                Mercado primário e secundário com preços calculados por VWAP das últimas 3 transações, simulando condições reais de mercado.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50 border-primary/10 hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-info" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Papéis Definidos</h3>
              <p className="text-muted-foreground">
                Founders, Angels e VCs com orçamentos diferenciados e objetivos específicos para uma experiência autêntica.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50 border-primary/10 hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6 text-warning" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Gestão de Startups</h3>
              <p className="text-muted-foreground">
                Interface completa para founders gerirem perfis, aprovar investimentos e controlar a venda das suas ações.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50 border-primary/10 hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Analytics Avançados</h3>
              <p className="text-muted-foreground">
                Dashboards em tempo real com KPIs, leaderboards e relatórios detalhados de performance e ROI.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50 border-primary/10 hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Suporte Multi-idioma</h3>
              <p className="text-muted-foreground">
                Plataforma disponível em 10 idiomas com formatação de moeda automática para eventos globais.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50 border-primary/10 hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center mb-6">
                <Trophy className="w-6 h-6 text-info" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Gamificação Total</h3>
              <p className="text-muted-foreground">
                Leaderboards públicos, circuit breakers e mecânicas de jogo que tornam o investimento numa experiência envolvente.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-primary/10 via-info/5 to-primary/10 rounded-3xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para Revolucionar os teus Eventos?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Junta-te à nova era do networking e investimento. Cria experiências únicas que os teus participantes nunca vão esquecer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary/80 px-8 py-6 text-lg">
              <Link to="/auth">
                Criar Conta Grátis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-8 py-6 text-lg">
              <Link to="/auth?mode=signin">
                Já tenho Conta
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-border/50">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-primary mb-4">Stox</h3>
          <p className="text-muted-foreground mb-6">
            Transformando eventos em experiências de investimento memoráveis
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Login</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Registo</Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}