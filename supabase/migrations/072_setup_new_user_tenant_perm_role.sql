-- Estende setup_new_user para gravar, opcionalmente, o papel de PERMISSÕES
-- por empresa (tenant_member_roles) junto com o vínculo de membership
-- (tenant_members) já existente. `perm_role` vazio/ausente = não cria linha,
-- usuário herda o papel global (profiles.role) nessa empresa.

CREATE OR REPLACE FUNCTION public.setup_new_user(
  p_user_id       uuid,
  p_name          text,
  p_role          text,
  p_active_tenant_id uuid,
  p_tenant_members   jsonb,   -- [{tenant_id: uuid, role: text, perm_role: text|null}]
  p_area_ids         uuid[],
  p_unit_ids         uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualiza perfil criado pelo trigger handle_new_user
  UPDATE profiles
  SET name              = p_name,
      role              = p_role,
      active_tenant_id  = p_active_tenant_id,
      updated_at        = now()
  WHERE id = p_user_id;

  -- Associa empresas
  IF p_tenant_members IS NOT NULL AND jsonb_array_length(p_tenant_members) > 0 THEN
    INSERT INTO tenant_members (user_id, tenant_id, role)
    SELECT p_user_id,
           (m->>'tenant_id')::uuid,
           m->>'role'
    FROM jsonb_array_elements(p_tenant_members) AS m;

    -- Papel de permissões por empresa (opcional, só quando perm_role vier preenchido).
    INSERT INTO tenant_member_roles (user_id, tenant_id, role)
    SELECT p_user_id,
           (m->>'tenant_id')::uuid,
           m->>'perm_role'
    FROM jsonb_array_elements(p_tenant_members) AS m
    WHERE COALESCE(m->>'perm_role', '') <> '';
  END IF;

  -- Restrição de áreas (vazio = acesso a todas)
  IF p_area_ids IS NOT NULL AND array_length(p_area_ids, 1) > 0 THEN
    INSERT INTO user_areas (user_id, area_id)
    SELECT p_user_id, unnest(p_area_ids);
  END IF;

  -- Restrição de unidades (vazio = acesso a todas)
  IF p_unit_ids IS NOT NULL AND array_length(p_unit_ids, 1) > 0 THEN
    INSERT INTO user_units (user_id, unit_id)
    SELECT p_user_id, unnest(p_unit_ids);
  END IF;
END;
$$;
