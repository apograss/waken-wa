export type HomepageSearchEngineId =
  | 'baidu'
  | 'bing'
  | 'google'
  | 'yandex'
  | 'sogou'
  | '360'

export type HomepageGreetingSource = 'hitokoto' | 'custom'

export type HomepageSearchEngine = {
  id: HomepageSearchEngineId
  name: string
  icon: string
  searchUrl: string
}

export type HomepageSettings = {
  visibleEngines: HomepageSearchEngineId[]
  defaultEngine: HomepageSearchEngineId
  greetingSource: HomepageGreetingSource
  greetingCustomText: string
  weatherEnabled: boolean
  demoEnabled: boolean
  coverImage: string
}
