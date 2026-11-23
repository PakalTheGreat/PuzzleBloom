-- CWG seed: specialties + subscription plans (hypotheses for Pro/Premium prices)

insert into public.specialties (slug, name_pt, description_pt, sort_order) values
  ('cultivo-indoor', 'Cultivo indoor', 'Consultoria técnica para cultivo indoor autorizado.', 10),
  ('cultivo-outdoor', 'Cultivo outdoor', 'Orientação agronômica para cultivo outdoor autorizado.', 20),
  ('nutricao-solo', 'Nutrição e solo', 'Manejo nutricional, substratos e análise de solo.', 30),
  ('ipm-pragas', 'IPM / pragas', 'Manejo integrado de pragas e doenças.', 40),
  ('genetica-sementes', 'Genética e sementes', 'Orientação profissional em genética (sem venda de produto).', 50),
  ('compliance-regulatorio', 'Compliance regulatório', 'Apoio a processos e conformidade legal.', 60),
  ('laboratorio-qa', 'Laboratório / QA', 'Qualidade, amostragem e interpretação de laudos.', 70),
  ('extracao-processamento', 'Extração / processamento', 'Processos técnicos (não commerce de produto).', 80),
  ('gestao-operacional', 'Gestão operacional', 'Operações, SOPs e produtividade.', 90),
  ('treinamento-equipes', 'Treinamento de equipes', 'Capacitação técnica de times autorizados.', 100)
on conflict (slug) do update
  set name_pt = excluded.name_pt,
      description_pt = excluded.description_pt,
      sort_order = excluded.sort_order,
      is_active = true;

insert into public.subscription_plans (code, name_pt, price_brl, sort_order) values
  ('free', 'Free', 0.00, 10),
  ('pro', 'Pro', 49.90, 20),
  ('premium', 'Premium', 99.90, 30)
on conflict (code) do update
  set name_pt = excluded.name_pt,
      price_brl = excluded.price_brl,
      sort_order = excluded.sort_order,
      is_active = true;

-- Plan feature hypotheses (entitlements only — never reputation)
insert into public.plan_features (plan_id, feature_key, feature_value)
select p.id, f.feature_key, f.feature_value
from public.subscription_plans p
join (
  values
    ('free'::public.subscription_plan_code, 'crm_client_cap', '25'),
    ('free', 'analytics_depth', 'basic'),
    ('free', 'portfolio_items_cap', '6'),
    ('pro', 'crm_client_cap', '200'),
    ('pro', 'analytics_depth', 'standard'),
    ('pro', 'portfolio_items_cap', '30'),
    ('premium', 'crm_client_cap', 'unlimited'),
    ('premium', 'analytics_depth', 'advanced'),
    ('premium', 'portfolio_items_cap', 'unlimited')
) as f(code, feature_key, feature_value)
  on p.code = f.code
on conflict (plan_id, feature_key) do update
  set feature_value = excluded.feature_value;

-- Phase 2 service categories
insert into public.service_categories (slug, name_pt, description_pt, sort_order) values
  ('consultoria-tecnica', 'Consultoria técnica', 'Sessão de orientação profissional.', 10),
  ('diagnostico-cultivo', 'Diagnóstico de cultivo', 'Avaliação técnica autorizada (sem endereço público).', 20),
  ('treinamento', 'Treinamento', 'Capacitação de equipes.', 30),
  ('compliance', 'Compliance', 'Apoio regulatório.', 40)
on conflict (slug) do update
  set name_pt = excluded.name_pt,
      description_pt = excluded.description_pt,
      sort_order = excluded.sort_order,
      is_active = true;
