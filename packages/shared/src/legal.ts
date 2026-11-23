/** Versioned legal documents — bump when copy changes; store acceptance with this version. */
export const LEGAL_VERSIONS = {
  terms: "2026-03-23",
  privacy: "2026-03-23",
} as const;

export const LEGAL_COPY = {
  termsTitle: "Termos de Uso",
  privacyTitle: "Política de Privacidade",
  ageTitle: "Confirmação de idade",
  ageBody:
    "Confirmo que tenho 18 anos ou mais. Esta confirmação é registrada na conta e não constitui autorização legal para cultivo.",
  termsSummary:
    "Ao continuar, você concorda com os Termos de Uso do CWG (versão vigente). O CWG é uma plataforma de serviços profissionais — não marketplace de produtos.",
  privacySummary:
    "Tratamos dados conforme a LGPD. Documentos de verificação ficam em armazenamento privado; perfis públicos expõem apenas campos autorizados.",
} as const;
