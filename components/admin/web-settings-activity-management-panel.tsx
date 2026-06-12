'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Clock3,
  Download,
  Loader2,
  OctagonX,
  RefreshCw,
  Search,
} from 'lucide-react'
import { useT } from 'next-i18next/client'
import { useDeferredValue, useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  BuildActivityAppsExportFileName,
} from '@/components/admin/activity-management-utils'
import { AddActivityForm } from '@/components/admin/add-activity-form'
import {
  exportAdminActivityApps,
  fetchActivityFeed,
  fetchActivityHistoryAppRows,
  fetchActivityHistoryPlaySourceRows,
} from '@/components/admin/admin-query-fetchers'
import { adminQueryKeys } from '@/components/admin/admin-query-keys'
import { endAdminActivity } from '@/components/admin/admin-query-mutations'
import {
  BuildRecentRecordSummary,
  FormatOverviewDate,
  FormatOverviewRelativeTime,
  GetRecordPushMode,
  ShouldShowRecentRecord,
} from '@/components/admin/dashboard-utils'
import {
  WebSettingsInset,
} from '@/components/admin/web-settings-layout'
import { useSiteTimeFormat } from '@/components/site-timezone-provider'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ActivityFeedItem } from '@/types/activity'
import type {
  AdminActivityHistoryAppRow,
  AdminActivityHistoryPlaySourceRow,
} from '@/types/admin'

const RECENT_ACTIVITY_LIMIT = 8
const HISTORY_PAGE_SIZE = 20

type HistoryKind = 'apps' | 'playSources'

function GetRecordTime(record: ActivityFeedItem): string | null | undefined {
  return record.lastReportAt || record.updatedAt || record.startedAt
}

function GetErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

function HistorySearchInput({
  id,
  value,
  placeholder,
  onChange,
}: {
  id: string
  value: string
  placeholder: string
  onChange: (value: string) => void
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  )
}

function HistoryList({
  kind,
  rows,
  loading,
  error,
  formatLastSeen,
  loadingText,
  emptyText,
  errorText,
}: {
  kind: HistoryKind
  rows: Array<AdminActivityHistoryAppRow | AdminActivityHistoryPlaySourceRow>
  loading: boolean
  error: boolean
  formatLastSeen: (value: string) => string
  loadingText: string
  emptyText: string
  errorText: string
}) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
        {loadingText}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-6 text-sm text-destructive">
        {errorText}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
        {emptyText}
      </div>
    )
  }

  return (
    <div className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-background/70">
      {rows.map((row) => {
        const label =
          kind === 'apps'
            ? (row as AdminActivityHistoryAppRow).processName
            : (row as AdminActivityHistoryPlaySourceRow).playSource
        return (
          <div key={`${kind}-${label}`} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <code className="min-w-0 truncate rounded bg-muted px-1.5 py-0.5 text-xs">
              {label}
            </code>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {formatLastSeen(row.lastSeenAt)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function WebSettingsActivityManagementPanel() {
  const { i18n, t } = useT('admin')
  const queryClient = useQueryClient()
  const { formatPattern } = useSiteTimeFormat()
  const [appSearch, setAppSearch] = useState('')
  const [playSourceSearch, setPlaySourceSearch] = useState('')
  const [exporting, setExporting] = useState(false)
  const deferredAppSearch = useDeferredValue(appSearch)
  const deferredPlaySourceSearch = useDeferredValue(playSourceSearch)

  const recentActivityQuery = useQuery({
    queryKey: adminQueryKeys.activity.recentUsage(),
    queryFn: fetchActivityFeed,
    select: (data) =>
      (Array.isArray(data.recentActivities) ? data.recentActivities : [])
        .filter(ShouldShowRecentRecord)
        .slice(0, RECENT_ACTIVITY_LIMIT),
  })
  const recentRecords = useMemo(
    () => recentActivityQuery.data ?? [],
    [recentActivityQuery.data],
  )

  const appHistoryQuery = useQuery({
    queryKey: adminQueryKeys.activity.historyAppRows({
      q: deferredAppSearch,
      limit: HISTORY_PAGE_SIZE,
    }),
    queryFn: () =>
      fetchActivityHistoryAppRows({
        q: deferredAppSearch,
        limit: HISTORY_PAGE_SIZE,
      }),
  })

  const playSourceHistoryQuery = useQuery({
    queryKey: adminQueryKeys.activity.historyPlaySourceRows({
      q: deferredPlaySourceSearch,
      limit: HISTORY_PAGE_SIZE,
    }),
    queryFn: () =>
      fetchActivityHistoryPlaySourceRows({
        q: deferredPlaySourceSearch,
        limit: HISTORY_PAGE_SIZE,
      }),
  })

  const endActivityMutation = useMutation({
    mutationFn: endAdminActivity,
    onSuccess: async () => {
      toast.success(t('webSettingsActivityManagement.toasts.ended'))
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.activity.recentUsage() }),
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.activity.feed() }),
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.activity.publicFeed() }),
      ])
    },
    onError: (error) => {
      toast.error(GetErrorMessage(error, t('mutation.endActivityFailed')))
    },
  })

  const formatLastSeen = (value: string) =>
    formatPattern(value, 'yyyy-MM-dd HH:mm', t('common.unknownTime'))

  const recentRecordsBody = useMemo(() => {
    if (recentActivityQuery.isLoading) {
      return (
        <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
          {t('webSettingsActivityManagement.recent.loading')}
        </div>
      )
    }

    if (recentActivityQuery.isError) {
      return (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-6 text-sm text-destructive">
          {t('webSettingsActivityManagement.recent.error')}
        </div>
      )
    }

    if (recentRecords.length === 0) {
      return (
        <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
          {t('webSettingsActivityManagement.recent.empty')}
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {recentRecords.map((record) => {
          const recordTime = GetRecordTime(record)
          const summary = BuildRecentRecordSummary(record, t('dashboard.noStatusDescription'))
          const mode = GetRecordPushMode(record)
          const isPersistentRecord = mode === 'active' && typeof record.id === 'number'
          const persistentRecordId = isPersistentRecord ? (record.id as number) : null
          const endingThisRecord =
            persistentRecordId !== null &&
            endActivityMutation.isPending &&
            endActivityMutation.variables === persistentRecordId

          return (
            <div
              key={record.id}
              className="rounded-xl border border-border/60 bg-background/70 px-3 py-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="min-w-0 truncate text-sm font-medium text-foreground">
                      {summary}
                    </p>
                    <Badge variant="outline">
                      {t(`webSettingsActivityManagement.recent.modes.${mode}`)}
                    </Badge>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {record.device || t('dashboard.unknownDevice')}
                    {record.processName ? ` - ${record.processName}` : ''}
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {formatPattern(recordTime, 'yyyy-MM-dd HH:mm', t('common.unknownTime'))}
                    {' - '}
                    {FormatOverviewDate(recordTime, formatPattern, t('common.unknownTime'))}
                    {' - '}
                    {FormatOverviewRelativeTime(
                      recordTime,
                      i18n.language,
                      t('dashboard.justNow'),
                    )}
                  </p>
                </div>

                {isPersistentRecord ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm" disabled={endingThisRecord}>
                        {endingThisRecord ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <OctagonX className="mr-1 h-4 w-4" />
                        )}
                        {t('webSettingsActivityManagement.recent.endNow')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t('webSettingsActivityManagement.recent.confirmEndTitle')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('webSettingsActivityManagement.recent.confirmEndDescription', {
                            summary,
                          })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          disabled={endingThisRecord}
                          onClick={() =>
                            persistentRecordId !== null
                              ? void endActivityMutation.mutateAsync(persistentRecordId)
                              : undefined
                          }
                        >
                          {endingThisRecord
                            ? t('webSettingsActivityManagement.recent.ending')
                            : t('webSettingsActivityManagement.recent.confirmEnd')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    )
  }, [
    endActivityMutation,
    formatPattern,
    i18n.language,
    recentActivityQuery.isError,
    recentActivityQuery.isLoading,
    recentRecords,
    t,
  ])

  const handleExportUsedApps = async () => {
    setExporting(true)
    try {
      const payload = JSON.stringify(await exportAdminActivityApps(), null, 2)
      const blob = new Blob([payload], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = BuildActivityAppsExportFileName()
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success(t('webSettingsActivityManagement.toasts.exported'))
    } catch (error) {
      toast.error(GetErrorMessage(error, t('query.exportFailed')))
    } finally {
      setExporting(false)
    }
  }

  return (
    <WebSettingsInset className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock3 className="h-4 w-4" />
            {t('webSettingsActivityManagement.title')}
          </h4>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t('webSettingsActivityManagement.description')}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExportUsedApps}
          disabled={exporting}
        >
          {exporting ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-1 h-4 w-4" />
          )}
          {t('webSettingsActivityManagement.actions.exportUsedApps')}
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="space-y-3 rounded-xl border border-border/60 bg-background/70 p-3 sm:p-4">
          <div className="space-y-1">
            <h5 className="text-sm font-medium text-foreground">
              {t('webSettingsActivityManagement.quickAdd.title')}
            </h5>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t('webSettingsActivityManagement.quickAdd.description')}
            </p>
          </div>
          <AddActivityForm />
        </div>

        <div className="space-y-3 rounded-xl border border-border/60 bg-background/70 p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h5 className="text-sm font-medium text-foreground">
                {t('webSettingsActivityManagement.recent.title')}
              </h5>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t('webSettingsActivityManagement.recent.description')}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void recentActivityQuery.refetch()}
              disabled={recentActivityQuery.isFetching}
            >
              {recentActivityQuery.isFetching ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-1 h-4 w-4" />
              )}
              {t('common.refresh')}
            </Button>
          </div>
          {recentRecordsBody}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-border/60 bg-background/70 p-3 sm:p-4">
          <div className="space-y-1">
            <h5 className="text-sm font-medium text-foreground">
              {t('webSettingsActivityManagement.historyApps.title')}
            </h5>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t('webSettingsActivityManagement.historyApps.description')}
            </p>
          </div>
          <HistorySearchInput
            id="activity-history-app-search"
            value={appSearch}
            placeholder={t('webSettingsActivityManagement.historyApps.searchPlaceholder')}
            onChange={setAppSearch}
          />
          <HistoryList
            kind="apps"
            rows={appHistoryQuery.data ?? []}
            loading={appHistoryQuery.isLoading}
            error={appHistoryQuery.isError}
            formatLastSeen={formatLastSeen}
            loadingText={t('webSettingsActivityManagement.historyApps.loading')}
            emptyText={
              appSearch.trim()
                ? t('webSettingsActivityManagement.historyApps.emptySearch')
                : t('webSettingsActivityManagement.historyApps.empty')
            }
            errorText={t('webSettingsActivityManagement.historyApps.error')}
          />
        </div>

        <div className="space-y-3 rounded-xl border border-border/60 bg-background/70 p-3 sm:p-4">
          <div className="space-y-1">
            <h5 className="text-sm font-medium text-foreground">
              {t('webSettingsActivityManagement.historyPlaySources.title')}
            </h5>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t('webSettingsActivityManagement.historyPlaySources.description')}
            </p>
          </div>
          <HistorySearchInput
            id="activity-history-play-source-search"
            value={playSourceSearch}
            placeholder={t('webSettingsActivityManagement.historyPlaySources.searchPlaceholder')}
            onChange={setPlaySourceSearch}
          />
          <HistoryList
            kind="playSources"
            rows={playSourceHistoryQuery.data ?? []}
            loading={playSourceHistoryQuery.isLoading}
            error={playSourceHistoryQuery.isError}
            formatLastSeen={formatLastSeen}
            loadingText={t('webSettingsActivityManagement.historyPlaySources.loading')}
            emptyText={
              playSourceSearch.trim()
                ? t('webSettingsActivityManagement.historyPlaySources.emptySearch')
                : t('webSettingsActivityManagement.historyPlaySources.empty')
            }
            errorText={t('webSettingsActivityManagement.historyPlaySources.error')}
          />
        </div>
      </div>
    </WebSettingsInset>
  )
}
