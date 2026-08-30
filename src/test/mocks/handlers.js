import { http, HttpResponse } from 'msw'

const adminUser = {
  id: 'u-admin',
  email: 'admin@queryable.local',
  name: 'Admin',
  role: 'admin',
  is_active: true,
  created_at: '2026-07-01T00:00:00Z',
  last_login_at: '2026-08-01T00:00:00Z',
  turn_count: 12,
  total_tokens: 4800,
}

const memberUser = {
  id: 'u-member',
  email: 'member@queryable.local',
  name: 'Member',
  role: 'member',
  is_active: true,
  created_at: '2026-07-01T00:00:00Z',
  last_login_at: null,
  turn_count: 5,
  total_tokens: 2000,
}

const memberUser2 = {
  id: 'u-member-2',
  email: 'member2@queryable.local',
  name: 'Second Member',
  role: 'member',
  is_active: true,
  created_at: '2026-07-02T00:00:00Z',
  last_login_at: null,
  turn_count: 0,
  total_tokens: 0,
}

const datasources = [
  {
    id: 'ds-1',
    name: 'school',
    db_type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database_name: 'school',
    username: 'data_retriever',
    status: 'ready',
    is_sample: false,
    description: '',
    schema_table_count: 5,
    created_at: '2026-07-30T00:00:00Z',
    updated_at: '2026-07-30T00:00:00Z',
  },
  {
    id: 'ds-2',
    name: 'Customers & Orders',
    db_type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database_name: 'sample_target',
    username: 'data_retriever',
    status: 'ready',
    is_sample: true,
    description: '',
    schema_table_count: 2,
    created_at: '2026-07-30T00:00:00Z',
    updated_at: '2026-07-30T00:00:00Z',
  },
]

const conversations = [
  {
    id: 'conv-1',
    data_source_id: 'ds-1',
    title: 'How many students are in each major?',
    created_at: '2026-07-30T00:00:00Z',
    updated_at: '2026-07-30T00:00:00Z',
    turn_count: 2,
  },
  {
    id: 'conv-2',
    data_source_id: 'ds-2',
    title: 'Top products by region',
    created_at: '2026-07-31T00:00:00Z',
    updated_at: '2026-07-31T00:00:00Z',
    turn_count: 1,
  },
]

const turns = [
  {
    id: 'turn-1',
    conversation_id: 'conv-1',
    sequence: 1,
    question_raw: 'How many students are in each major?',
    question_resolved: null,
    generated_sql: 'SELECT major, COUNT(*) AS n FROM students GROUP BY major',
    result_columns: [['major', 'n']],
    result_row_count: 5,
    result_data: [
      { major: 'CS', n: 8 },
      { major: 'EE', n: 5 },
      { major: 'ME', n: 4 },
      { major: 'CE', n: 2 },
      { major: 'Math', n: 1 },
    ],
    summary: 'Computer Science is the most popular major with 8 students.',
    chart_spec: { type: 'bar', title: 'Students by major', x: 'major', y: 'n' },
    kpis: [{ label: 'TOP MAJOR', value: 'CS', trend: 'flat' }],
    no_query: false,
    status: 'completed',
    execution_ms: 1234,
    created_at: '2026-07-30T00:00:00Z',
  },
  {
    id: 'turn-2',
    conversation_id: 'conv-1',
    sequence: 2,
    question_raw: 'And the largest department?',
    question_resolved: 'What is the department with the most students?',
    generated_sql: 'SELECT d.name, COUNT(e.id) AS n FROM departments d LEFT JOIN courses c ON c.department_id = d.id LEFT JOIN enrollments e ON e.course_id = c.id GROUP BY d.name ORDER BY n DESC LIMIT 1',
    result_columns: [['name', 'n']],
    result_row_count: 1,
    result_data: [{ name: 'Engineering', n: 12 }],
    summary: 'Engineering is the largest department.',
    chart_spec: null,
    kpis: [{ label: 'LARGEST DEPT', value: 'Engineering', trend: 'flat' }],
    no_query: false,
    status: 'completed',
    execution_ms: 987,
    created_at: '2026-07-30T00:00:00Z',
  },
]

const queryResponse = (question) => ({
  summary: `Answered: ${question}`,
  chart_spec: { type: 'bar', title: 'Results', x: 'name', y: 'count' },
  kpis: [{ label: 'TOTAL', value: '5', trend: 'flat' }],
  sql: 'SELECT name, COUNT(*) AS count FROM customers GROUP BY name LIMIT 1000',
  rows: [
    { name: 'North', count: 3 },
    { name: 'South', count: 2 },
  ],
  row_count: 2,
  execution_time: 0.42,
  no_query: false,
  question_resolved: null,
  conversation_id: 'conv-1',
  turn_id: 'turn-99',
  guest_quota: { limit: 5, used: 1, remaining: 4 },
})

export const handlers = [
  http.get('/api/v1/auth/csrf', () =>
    HttpResponse.json({ csrf_token: 'test-csrf-token' }),
  ),
  http.get('/api/v1/auth/me', () =>
    HttpResponse.json({ is_authenticated: true, user: adminUser }),
  ),
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = await request.json()
    if (!body.email || !body.password) {
      return HttpResponse.json(
        { error: 'Email and password are required', code: 'missing_credentials' },
        { status: 400 },
      )
    }
    if (body.password === 'wrong') {
      return HttpResponse.json(
        { error: 'Invalid email or password', code: 'invalid_credentials' },
        { status: 401 },
      )
    }
    return HttpResponse.json({ user: memberUser })
  }),
  http.post('/api/v1/auth/logout', () => HttpResponse.json({ ok: true })),
  http.post('/api/v1/auth/claim-guest', () => HttpResponse.json({ migrated: 0 })),
  http.post('/api/v1/auth/forgot-password', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ message: 'If an account exists, a reset link has been sent.', token: 'test-reset-token' })
  }),
  http.post('/api/v1/auth/reset-password', async ({ request }) => {
    const body = await request.json()
    if (!body.token || !body.new_password) {
      return HttpResponse.json({ error: 'Token and new password are required', code: 'missing_fields' }, { status: 400 })
    }
    return HttpResponse.json({ message: 'Password has been reset. Please sign in.' })
  }),

  http.get('/api/v1/admin/users', ({ request }) => {
    const url = new URL(request.url)
    const role = url.searchParams.get('role')
    const items =
      role === 'member' ? [memberUser, memberUser2] : [adminUser, memberUser, memberUser2]
    const activeAdminCount = items.filter((u) => u.role === 'admin' && u.status === 'active').length
    return HttpResponse.json({ total: items.length, items, active_admin_count: activeAdminCount })
  }),

  http.get('/api/v1/admin/datasources/:id/grants', () =>
    HttpResponse.json([
      {
        id: 'grant-1',
        user_id: 'u-member',
        data_source_id: 'ds-1',
        granted_by: 'u-admin',
        created_at: '2026-08-01T00:00:00Z',
      },
    ]),
  ),
  http.post('/api/v1/admin/datasources/:id/grants', async ({ request }) => {
    const body = await request.json()
    if (!body.user_id) {
      return HttpResponse.json(
        { error: 'user_id is required', code: 'missing_fields' },
        { status: 400 },
      )
    }
    return HttpResponse.json(
      {
        id: 'grant-new',
        user_id: body.user_id,
        data_source_id: 'ds-1',
        granted_by: 'u-admin',
        created_at: '2026-08-20T00:00:00Z',
      },
      { status: 201 },
    )
  }),
  http.delete('/api/v1/admin/grants/:id', () => HttpResponse.json({ ok: true })),

  http.get('/api/v1/datasources', () => HttpResponse.json(datasources)),
  http.post('/api/v1/datasources', () =>
    HttpResponse.json(
      { ...datasources[0], id: 'ds-new', name: 'new-ds' },
      { status: 201 },
    ),
  ),
  http.get('/api/v1/datasources/:id', ({ params }) => {
    const ds = datasources.find((d) => d.id === params.id)
    return ds ? HttpResponse.json(ds) : HttpResponse.json({ error: 'Not found' }, { status: 404 })
  }),
  http.delete('/api/v1/datasources/:id', () =>
    HttpResponse.json({ ok: true }),
  ),
  http.post('/api/v1/datasources/test-connection', () =>
    HttpResponse.json({ success: true, message: 'Connection successful' }),
  ),
  http.post('/api/v1/datasources/:id/introspect', () =>
    HttpResponse.json([
      {
        id: 'cat-1',
        table_name: 'customers',
        columns: [{ name: 'id', type: 'integer' }],
        relationships: [],
        row_count: 8,
      },
    ]),
  ),
  http.get('/api/v1/datasources/:id/suggestions', ({ params }) => {
    const suggestions =
      params.id === 'ds-1'
        ? [
            'How many students are in each major?',
            'What are the top 5 majors by enrollment?',
            'Which department has the most students?',
          ]
        : ['What is the total amount by status?']
    return HttpResponse.json({ suggestions })
  }),
  http.put('/api/v1/datasources/:id/schema/:catalogId', ({ params }) =>
    HttpResponse.json({
      id: params.catalogId,
      table_name: 'customers',
      columns: [],
      relationships: [],
      row_count: 8,
    }),
  ),

  http.post('/api/v1/query', async ({ request }) => {
    const body = await request.json()
    const result = queryResponse(body.question)
    const lines = []
    for (let step = 0; step < 5; step += 1) {
      lines.push(JSON.stringify({ type: 'progress', step }))
    }
    lines.push(JSON.stringify({ type: 'result', ...result }))
    return HttpResponse.text(lines.join('\n'), {
      headers: { 'Content-Type': 'application/x-ndjson' },
    })
  }),

  http.get('/api/v1/conversations', ({ request }) => {
    const url = new URL(request.url)
    const dsId = url.searchParams.get('data_source_id')
    const list = dsId ? conversations.filter((c) => c.data_source_id === dsId) : conversations
    const page = Number(url.searchParams.get('page') ?? 1)
    const perPage = Math.min(Number(url.searchParams.get('per_page') ?? 20), 100)
    const start = (page - 1) * perPage
    const items = list.slice(start, start + perPage)
    return HttpResponse.json({
      items,
      total: list.length,
      page,
      per_page: perPage,
      pages: Math.ceil(list.length / perPage),
    })
  }),
  http.get('/api/v1/conversations/:id', () =>
    HttpResponse.json({ ...conversations[0], turns }),
  ),
  http.delete('/api/v1/conversations/:id', () => HttpResponse.json({ ok: true })),
]
