-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Tenants Table
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- 2. Profiles Table (Extends Supabase Auth users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete set null,
  role text not null check (role in ('super_admin', 'tenant_user')) default 'tenant_user',
  email text,
  created_at timestamptz not null default now()
);

-- 3. Tenant API Keys Table (For collector agents)
create table public.tenant_api_keys (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  token text not null unique,
  name text not null default 'Default Agent Key',
  created_at timestamptz not null default now()
);

-- 4. Equipo Groups Table
create table public.equipo_groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- 5. Equipos (Computer Equipments) Table
create table public.equipos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  hostname text not null,
  os text not null,
  processor text not null,
  ram_details jsonb not null, -- Stores details per module & totals
  disk_details jsonb not null, -- Stores partitions, sizes, usage
  last_user text not null,
  serial_number text not null,
  model text not null,
  manufacturer text not null,
  antivirus text,
  office_version text,
  files_list jsonb,
  startup_programs jsonb,
  notes text,
  group_id uuid references public.equipo_groups(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_tenant_hostname_serial unique(tenant_id, hostname, serial_number)
);

-- Enable Row Level Security (RLS)
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.tenant_api_keys enable row level security;
alter table public.equipo_groups enable row level security;
alter table public.equipos enable row level security;

-- Helper SQL functions to get current user details
create or replace function public.get_my_role()
returns text security definer as $$
  select role from public.profiles where id = auth.uid();
$$ language sql;

create or replace function public.get_my_tenant_id()
returns uuid security definer as $$
  select tenant_id from public.profiles where id = auth.uid();
$$ language sql;

-- RLS Policies

-- Tenants policies
create policy "Super admins can manage all tenants" 
  on public.tenants for all 
  using (public.get_my_role() = 'super_admin');

create policy "Users can view their own tenant" 
  on public.tenants for select 
  using (id = public.get_my_tenant_id());

-- Profiles policies
create policy "Super admins can manage all profiles" 
  on public.profiles for all 
  using (public.get_my_role() = 'super_admin');

create policy "Users can view profiles in their tenant" 
  on public.profiles for select 
  using (tenant_id = public.get_my_tenant_id());

create policy "Users can update their own profile" 
  on public.profiles for update 
  using (id = auth.uid());

-- API Keys policies
create policy "Super admins can manage api keys" 
  on public.tenant_api_keys for all 
  using (public.get_my_role() = 'super_admin');

create policy "Users can view their tenant's api keys" 
  on public.tenant_api_keys for select 
  using (tenant_id = public.get_my_tenant_id());

-- Equipo Groups policies
create policy "Super admins can manage all groups" 
  on public.equipo_groups for all 
  using (public.get_my_role() = 'super_admin');

create policy "Users can view their tenant's groups" 
  on public.equipo_groups for select 
  using (tenant_id = public.get_my_tenant_id());

create policy "Users can update their tenant's groups" 
  on public.equipo_groups for all 
  using (tenant_id = public.get_my_tenant_id());

-- Equipos policies
create policy "Super admins can manage all computers" 
  on public.equipos for all 
  using (public.get_my_role() = 'super_admin');

create policy "Users can view their tenant's computers" 
  on public.equipos for select 
  using (tenant_id = public.get_my_tenant_id());

create policy "Users can update their tenant's computers" 
  on public.equipos for update 
  using (tenant_id = public.get_my_tenant_id());

-- Automatically update updated_at timestamp trigger
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_equipos_updated_at
  before update on public.equipos
  for each row execute procedure public.update_updated_at_column();

-- Create profile trigger on user signup
create or replace function public.handle_new_user()
returns trigger security definer as $$
begin
  insert into public.profiles (id, email, role, tenant_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'tenant_user'),
    (new.raw_user_meta_data->>'tenant_id')::uuid
  );
  return new;
end;
$$ language plpgsql;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
