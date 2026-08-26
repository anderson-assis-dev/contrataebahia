import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './LegalPage.css';
import { BRAND_NAME, BRAND_EMAIL } from '../utils/brand';

export default function PrivacyPolicy() {
  return (
    <div>
      <section className="legal-hero">
        <div className="legal-hero-inner">
          <Link to="/" className="legal-back"><ArrowLeft size={15} /> Voltar ao início</Link>
          <h1>Política de Privacidade</h1>
          <div className="legal-updated">Última atualização: 26 de agosto de 2026</div>
        </div>
      </section>

      <div className="legal-body">
        <div className="legal-alert">
          <strong>Seu dado é seu.</strong>
          Estamos comprometidos com a proteção dos seus dados pessoais em conformidade com a LGPD
          (Lei nº 13.709/2018). Leia esta Política para entender como seus dados são tratados.
        </div>

        <div className="legal-section">
          <h2><span>1.</span> Controlador dos Dados</h2>
          <p>O controlador responsável pelo tratamento dos seus dados pessoais é:</p>
          <ul>
            <li><strong>Plataforma:</strong> {BRAND_NAME}</li>
            <li><strong>E-mail do Encarregado (DPO):</strong> {BRAND_EMAIL}</li>
            <li><strong>Website:</strong> https://contrataebahia.com.br</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2><span>2.</span> Dados Pessoais que Coletamos</h2>

          <h3>2.1. Dados de cadastro (fornecidos por você):</h3>
          <ul>
            <li>Nome completo</li>
            <li>Endereço de e-mail</li>
            <li>Número de telefone celular</li>
            <li>CPF ou CNPJ</li>
            <li>Data de nascimento</li>
            <li>Nome da mãe (para verificação de identidade)</li>
            <li>Endereço completo (CEP, rua, bairro, cidade, estado)</li>
            <li>Foto de perfil (opcional)</li>
            <li>Categorias de serviço de interesse</li>
          </ul>

          <h3>2.2. Dados de uso (coletados automaticamente):</h3>
          <ul>
            <li>Endereço IP e informações do dispositivo</li>
            <li>Sistema operacional e navegador</li>
            <li>Dados de navegação e interação com a Plataforma</li>
            <li>Logs de acesso com data e hora</li>
          </ul>

          <h3>2.3. Dados de localização:</h3>
          <ul>
            <li>Localização aproximada, quando você autoriza o uso no navegador</li>
            <li>Cidade informada no filtro de busca</li>
            <li>Endereço cadastrado</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2><span>3.</span> Finalidades do Tratamento</h2>

          <h3>3.1. Execução de contrato (Art. 7º, V da LGPD):</h3>
          <ul>
            <li>Criar e gerenciar sua conta na Plataforma;</li>
            <li>Conectar clientes a prestadores qualificados na sua região;</li>
            <li>Processar pedidos e propostas;</li>
            <li>Facilitar a comunicação entre as partes.</li>
          </ul>

          <h3>3.2. Consentimento (Art. 7º, I):</h3>
          <ul>
            <li>Enviar notificações sobre pedidos, propostas e mensagens;</li>
            <li>Enviar e-mails transacionais e informativos;</li>
            <li>Utilizar localização para encontrar serviços e prestadores próximos;</li>
            <li>Coletar e exibir avaliações e reputação de prestadores.</li>
          </ul>

          <h3>3.3. Legítimo interesse (Art. 7º, IX):</h3>
          <ul>
            <li>Melhorar a experiência do usuário e a performance da Plataforma;</li>
            <li>Prevenir fraudes e garantir a segurança;</li>
            <li>Analisar métricas agregadas de uso.</li>
          </ul>

          <h3>3.4. Cumprimento de obrigação legal (Art. 7º, II):</h3>
          <ul>
            <li>Manter registros de acesso conforme o Marco Civil da Internet (Lei nº 12.965/2014);</li>
            <li>Cumprir obrigações fiscais e contábeis;</li>
            <li>Atender ordens judiciais e requisições de autoridades competentes.</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2><span>4.</span> Compartilhamento de Dados</h2>
          <p>
            Não vendemos, alugamos ou comercializamos seus dados pessoais. O compartilhamento ocorre
            exclusivamente nas situações abaixo:
          </p>
          <ul>
            <li>
              <strong>Prestadores de serviço:</strong> dados necessários para o serviço contratado
              (nome, telefone, endereço de atendimento);
            </li>
            <li>
              <strong>Fornecedores de infraestrutura:</strong> hospedagem, envio de e-mails e
              notificações, sob obrigação contratual de confidencialidade;
            </li>
            <li>
              <strong>Autoridades públicas:</strong> quando exigido por lei, decisão judicial ou para
              proteção dos nossos direitos legais.
            </li>
          </ul>
          <p>Todos os parceiros são obrigados contratualmente a tratar os dados em conformidade com a LGPD.</p>
        </div>

        <div className="legal-section">
          <h2><span>5.</span> Segurança dos Dados</h2>
          <ul>
            <li>Criptografia de dados em trânsito (TLS/SSL) e em repouso;</li>
            <li>Senhas armazenadas com hash (nunca em texto simples);</li>
            <li>Autenticação com tokens de sessão com expiração;</li>
            <li>Controle de acesso baseado em perfis (cliente e prestador);</li>
            <li>Monitoramento de acessos e atividades suspeitas;</li>
            <li>Backups regulares e redundância de dados.</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2><span>6.</span> Retenção de Dados</h2>
          <ul>
            <li><strong>Dados de conta ativa:</strong> mantidos enquanto sua conta estiver ativa;</li>
            <li>
              <strong>Após exclusão de conta:</strong> dados necessários para obrigações legais serão
              mantidos pelo prazo aplicável (5 anos para obrigações fiscais);
            </li>
            <li>
              <strong>Logs de acesso:</strong> mantidos por 6 meses conforme o Marco Civil da Internet;
            </li>
            <li>
              <strong>Dados anonimizados:</strong> podem ser mantidos indefinidamente para fins
              estatísticos.
            </li>
          </ul>
        </div>

        <div className="legal-section">
          <h2><span>7.</span> Seus Direitos como Titular (LGPD — Art. 18)</h2>
          <ul>
            <li>
              <strong>Confirmação e acesso:</strong> confirmar a existência de tratamento e acessar
              seus dados;
            </li>
            <li>
              <strong>Correção:</strong> solicitar correção de dados incompletos, inexatos ou
              desatualizados;
            </li>
            <li>
              <strong>Anonimização ou eliminação:</strong> de dados desnecessários ou tratados em
              desconformidade com a LGPD;
            </li>
            <li><strong>Portabilidade:</strong> solicitar portabilidade dos dados para outro fornecedor;</li>
            <li>
              <strong>Revogação do consentimento:</strong> a qualquer momento, de forma gratuita e
              facilitada.
            </li>
          </ul>
          <p>
            Para exercer seus direitos, entre em contato pelo e-mail <strong>{BRAND_EMAIL}</strong>.
            Responderemos em até 15 dias úteis.
          </p>
        </div>

        <div className="legal-section">
          <h2><span>8.</span> Localização</h2>
          <p>
            Dados de localização são usados exclusivamente para conectar clientes a prestadores
            próximos e calcular distâncias. Não armazenamos histórico de localização em tempo real. A
            coleta requer autorização prévia e pode ser desativada nas configurações do seu
            navegador.
          </p>
        </div>

        <div className="legal-section">
          <h2><span>9.</span> Cookies</h2>
          <p>
            Utilizamos cookies para manter sua sessão autenticada, lembrar preferências e analisar a
            performance da Plataforma. Você pode gerenciar cookies nas configurações do seu navegador.
          </p>
        </div>

        <div className="legal-section">
          <h2><span>10.</span> Transferência Internacional</h2>
          <p>
            Alguns fornecedores de infraestrutura podem processar dados fora do Brasil. Garantimos
            que esses dados são transferidos apenas para países com nível adequado de proteção ou com
            salvaguardas compatíveis com a LGPD.
          </p>
        </div>

        <div className="legal-section">
          <h2><span>11.</span> Menores de Idade</h2>
          <p>
            O {BRAND_NAME} não é direcionado a menores de 18 anos e não coletamos intencionalmente
            dados de menores. Caso identificado, procederemos com a eliminação imediata.
          </p>
        </div>

        <div className="legal-section">
          <h2><span>12.</span> Alterações desta Política</h2>
          <p>
            Esta Política pode ser atualizada periodicamente. Notificaremos sobre alterações
            significativas por e-mail e/ou na Plataforma. A data de atualização estará sempre
            indicada no topo desta página.
          </p>
        </div>

        <div className="legal-section">
          <h2><span>13.</span> Autoridade Nacional de Proteção de Dados (ANPD)</h2>
          <p>
            Se entender que o tratamento dos seus dados viola a LGPD, você pode apresentar reclamação
            perante a ANPD:{' '}
            <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer">
              www.gov.br/anpd
            </a>
          </p>
        </div>

        <div className="legal-contact">
          <h3>Encarregado de Dados (DPO)</h3>
          <p>Para exercer seus direitos ou esclarecer dúvidas sobre privacidade:</p>
          <p><strong>E-mail:</strong> <a href={`mailto:${BRAND_EMAIL}`}>{BRAND_EMAIL}</a></p>
        </div>
      </div>
    </div>
  );
}
