import { supabase } from '../lib/supabase';

export const auth = {
  async signUp(email: string, password: string, firstName: string, lastName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    if (error) throw error;

    // Create profile in public.profiles table
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: data.user.email,
        first_name: firstName,
        last_name: lastName,
      });
    }

    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
  }
};

export const db = {
  clientes: {
    async list() {
      const { data, error } = await supabase.from('clientes').select('*');
      if (error) throw error;
      return data;
    },
    async create(nome: string, cpf?: string) {
      const { data, error } = await supabase.from('clientes').insert({ nome, cpf }).select();
      if (error) throw error;
      return data?.[0];
    },
  },

  empreendimentos: {
    async list() {
      const { data, error } = await supabase.from('empreendimentos').select('*');
      if (error) throw error;
      return data;
    },
    async create(nome: string) {
      const { data, error } = await supabase.from('empreendimentos').insert({ nome }).select();
      if (error) throw error;
      return data?.[0];
    },
  },

  tabelasMensais: {
    async list() {
      const { data, error } = await supabase.from('tabelas_mensais').select('*').order('mes_referencia', { ascending: false });
      if (error) throw error;
      return data;
    },
    async create(mesReferencia: string) {
      const { data, error } = await supabase.from('tabelas_mensais').insert({ mes_referencia: mesReferencia }).select();
      if (error) throw error;
      return data?.[0];
    },
    async delete(id: string) {
      const { error } = await supabase.from('tabelas_mensais').delete().eq('id', id);
      if (error) throw error;
    },
  },

  vendas: {
    async list(filters?: any) {
      let query = supabase.from('vendas').select('*, clientes(nome), empreendimentos(nome), tabelas_mensais(mes_referencia)');

      if (filters?.tabelaMensalId) {
        query = query.eq('tabela_mensal_id', filters.tabelaMensalId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.search) {
        query = query.ilike('clientes.nome', `%${filters.search}%`);
      }

      const { data, error } = await query.order('data_venda', { ascending: false });
      if (error) throw error;
      return data;
    },
    async create(venda: any) {
      const { data, error } = await supabase.from('vendas').insert(venda).select();
      if (error) throw error;
      return data?.[0];
    },
    async update(id: string, updates: any) {
      const { data, error } = await supabase.from('vendas').update(updates).eq('id', id).select();
      if (error) throw error;
      return data?.[0];
    },
  },

  analiseEPR: {
    async list() {
      const { data, error } = await supabase.from('analise_epr').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    async create(analise: any) {
      const { data, error } = await supabase.from('analise_epr').insert(analise).select();
      if (error) throw error;
      return data?.[0];
    },
    async getById(id: string) {
      const { data, error } = await supabase.from('analise_epr').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
    async update(id: string, updates: any) {
      const { data, error } = await supabase.from('analise_epr').update(updates).eq('id', id).select();
      if (error) throw error;
      return data?.[0];
    },
  },
};

export default { auth, db };
