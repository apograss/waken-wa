import {
  headerParameter,
  jsonContent,
  response,
  skillsHeaderSecurity,
} from '@/lib/openapi/helpers'

const settingsCategoryPaths = [
  {
    path: '/api/llm/settings/core',
    label: 'core',
    summary: 'Read or update core site settings',
    example: {
      currentlyText: 'Current Status',
      statusCardEnabled: true,
    },
  },
  {
    path: '/api/llm/settings/theme',
    label: 'theme',
    summary: 'Read or update theme site settings',
    example: {
      themePreset: 'customSurface',
      themeCustomSurface: { primary: '#da6d4b', accent: '#2d8f85' },
    },
  },
  {
    path: '/api/llm/settings/schedule',
    label: 'schedule',
    summary: 'Read or update schedule site settings',
    example: {
      scheduleHomeShowLocation: true,
      scheduleHomeShowTeacher: true,
    },
  },
  {
    path: '/api/llm/settings/rules',
    label: 'rules',
    summary: 'Read or update app/message rule settings',
    example: {
      appFilterMode: 'blacklist',
      appBlacklist: ['LockApp.exe'],
    },
  },
] as const

function settingsCategoryPath(item: (typeof settingsCategoryPaths)[number]) {
  const security = skillsHeaderSecurity(
    'Use the Skills header set returned by GET /api/llm/direct. OAuth mode also requires LLM-Skills-AI.',
  )
  const parameters = [
    { $ref: '#/components/parameters/LlmSkillsAi' },
    { $ref: '#/components/parameters/LlmSkillsScope' },
    { $ref: '#/components/parameters/LlmSkillsRequestId' },
  ]
  const responseSchema = {
    allOf: [
      { $ref: '#/components/schemas/SuccessEnvelope' },
      { type: 'object', properties: { data: { type: ['object', 'null'], additionalProperties: true } } },
    ],
  }

  return {
    get: {
      tags: ['LLM'],
      summary: item.summary,
      description: `Read only the v2 ${item.label} settings category. The combined /api/llm/settings endpoint has been removed.`,
      security,
      parameters,
      responses: {
        '200': response(`Current ${item.label} settings.`, responseSchema),
        '401': response('Missing or invalid Skills headers/token.', {
          $ref: '#/components/schemas/ErrorEnvelope',
        }),
        '403': response('Mode mismatch or AI/token mismatch.', {
          $ref: '#/components/schemas/ErrorEnvelope',
        }),
        '500': response('Unexpected server error.', {
          $ref: '#/components/schemas/ErrorEnvelope',
        }),
      },
    },
    patch: {
      tags: ['LLM'],
      summary: item.summary,
      description:
        `Update only the v2 ${item.label} settings category. Send minimal fields and do not mix fields from other categories.`,
      security,
      parameters,
      requestBody: {
        required: true,
        content: jsonContent(
          { $ref: '#/components/schemas/SiteConfigPatch' },
          { minimalUpdate: { value: item.example } },
        ),
      },
      responses: {
        '200': response(`Updated ${item.label} settings.`, responseSchema),
        '400': response('Invalid JSON object, invalid field value, or wrong category field.', {
          $ref: '#/components/schemas/ErrorEnvelope',
        }),
        '401': response('Missing or invalid Skills headers/token.', {
          $ref: '#/components/schemas/ErrorEnvelope',
        }),
        '403': response('Restricted field included or mode mismatch.', {
          $ref: '#/components/schemas/ErrorEnvelope',
        }),
        '409': response('Settings must be migrated before this category can be written.', {
          $ref: '#/components/schemas/ErrorEnvelope',
        }),
        '500': response('Unexpected server error.', {
          $ref: '#/components/schemas/ErrorEnvelope',
        }),
      },
    },
  }
}

export function buildLlmPaths() {
  const paths: Record<string, unknown> = {
    '/api/llm/direct': {
      get: {
        tags: ['LLM'],
        summary: 'Discover current LLM/Skills/MCP capabilities',
        description:
          'Required first call for AI clients that help manage the personal life panel. Detects active mode, endpoints, next steps, and whether OAuth, API key, or legacy MCP should be used.',
        parameters: [
          { $ref: '#/components/parameters/LlmMode' },
          { $ref: '#/components/parameters/LlmAi' },
          headerParameter('LLM-Skills-Mode', 'Optional mode hint.', false),
          headerParameter('LLM-Skills-Token', 'Optional token header.', false),
          { $ref: '#/components/parameters/LlmSkillsAi' },
          { $ref: '#/components/parameters/LlmSkillsScope' },
        ],
        responses: {
          '200': response('Capabilities resolved and ready for client use.', {
            $ref: '#/components/schemas/LlmDirectSuccess',
          }),
          '400': response('Deprecated query-token usage or other malformed request.', {
            $ref: '#/components/schemas/LlmDirectFailure',
          }),
          '401': response('Token missing or unsupported for the requested mode.', {
            $ref: '#/components/schemas/LlmDirectFailure',
          }),
          '403': response('Mode mismatch or unavailable flow.', {
            $ref: '#/components/schemas/LlmDirectFailure',
          }),
          '404': response('LLM debugging is disabled.', {
            $ref: '#/components/schemas/LlmDirectFailure',
          }),
          '503': response('Server not configured for the requested capability yet.', {
            $ref: '#/components/schemas/LlmDirectFailure',
          }),
        },
      },
    },
    '/api/llm/md': {
      get: {
        tags: ['LLM'],
        summary: 'Read the AI-oriented protocol markdown',
        description:
          'Returns a Markdown protocol document written for AI clients working on the Waken-Wa life panel. Scalar references it as supplemental guidance rather than replacing it.',
        responses: {
          '200': {
            description: 'Markdown protocol document.',
            content: { 'text/markdown': { schema: { type: 'string' } } },
          },
        },
      },
    },
    '/api/llm/activity/apps-export': {
      get: {
        tags: ['LLM'],
        summary: 'Export used activity apps',
        security: skillsHeaderSecurity('Uses the same Skills auth headers as the v2 settings category endpoints.'),
        parameters: [
          { $ref: '#/components/parameters/LlmSkillsAi' },
          { $ref: '#/components/parameters/LlmSkillsScope' },
          { $ref: '#/components/parameters/LlmSkillsRequestId' },
        ],
        responses: {
          '200': response('Grouped activity app export.', {
            allOf: [
              { $ref: '#/components/schemas/SuccessEnvelope' },
              { type: 'object', properties: { data: { $ref: '#/components/schemas/AppsExport' } } },
            ],
          }),
          '401': response('Missing or invalid Skills headers/token.', {
            $ref: '#/components/schemas/ErrorEnvelope',
          }),
          '403': response('Mode mismatch or AI/token mismatch.', {
            $ref: '#/components/schemas/ErrorEnvelope',
          }),
          '500': response('Unexpected server error.', {
            $ref: '#/components/schemas/ErrorEnvelope',
          }),
        },
      },
    },
    '/api/llm/oauth/exchange': {
      post: {
        tags: ['LLM'],
        summary: 'Exchange OAuth authorize code for a Skills token',
        description:
          'OAuth-only endpoint. Send the short-lived authorize code via LLM-Skills-Token and the same stable AI name via LLM-Skills-AI.',
        security: skillsHeaderSecurity(
          'Requires LLM-Skills-Mode: oauth, the authorize code in LLM-Skills-Token, and the original LLM-Skills-AI value.',
        ),
        parameters: [
          { $ref: '#/components/parameters/LlmSkillsAi' },
          { $ref: '#/components/parameters/LlmSkillsRequestId' },
        ],
        requestBody: {
          required: false,
          content: jsonContent({ type: 'object', additionalProperties: false }),
        },
        responses: {
          '200': response('OAuth token issued successfully.', {
            $ref: '#/components/schemas/OauthExchange',
          }),
          '401': response('Missing/invalid code, AI mismatch, not approved, or expired.', {
            $ref: '#/components/schemas/ErrorEnvelope',
          }),
          '403': response('Current server mode is not OAuth.', {
            $ref: '#/components/schemas/ErrorEnvelope',
          }),
          '404': response('LLM debugging is disabled.', {
            $ref: '#/components/schemas/ErrorEnvelope',
          }),
        },
      },
    },
  }
  for (const item of settingsCategoryPaths) {
    paths[item.path] = settingsCategoryPath(item)
  }
  return paths
}
