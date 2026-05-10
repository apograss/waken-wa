'use client'

import { Clock3, Loader2, MonitorSmartphone, OctagonX, RefreshCw, Users } from 'lucide-react'
import { useT } from 'next-i18next/client'

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
import { Button } from '@/components/ui/button'
import type { ActivityFeedItem } from '@/types/activity'

import { AddActivityForm } from './add-activity-form'
import {
  BuildRecentRecordSummary,
  FormatOverviewClock,
  FormatOverviewDate,
  FormatOverviewRelativeTime,
  GetRecordPushMode,
  type OverviewFormatPattern,
} from './dashboard-utils'

interface DashboardOverviewPanelProps {
  viewerCount: number
  viewerCountLoading: boolean
  viewerCountError: boolean
  viewerCountUpdatedAt: string | null | undefined
  recentActivityUsage: ActivityFeedItem[]
  recentActivityUsageLoading: boolean
  recentActivityUsageFetching: boolean
  locale: string
  formatPattern: OverviewFormatPattern
  onRefreshRecentActivity: () => void
  onOpenDevices: () => void
  onEndActivity: (recordId: number) => Promise<void>
  endingActivityId: number | null
  endingActivityPending: boolean
}

export function DashboardOverviewPanel({
  viewerCount,
  viewerCountLoading,
  viewerCountError,
  viewerCountUpdatedAt,
  recentActivityUsage,
  recentActivityUsageLoading,
  recentActivityUsageFetching,
  locale,
  formatPattern,
  onRefreshRecentActivity,
  onOpenDevices,
  onEndActivity,
  endingActivityId,
  endingActivityPending,
}: DashboardOverviewPanelProps) {
  const { t } = useT('admin')

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <Users className="h-4 w-4" />
              {t('dashboard.viewerCountTitle')}
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              {t('dashboard.viewerCountDescription')}
            </p>
          </div>
          <div className="rounded-full border border-primary/15 bg-primary/8 p-3 text-primary shadow-sm">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-4xl font-semibold tracking-tight tabular-nums text-foreground">
              {viewerCount}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {viewerCountError
                ? t('dashboard.viewerCountLoadFailed')
                : viewerCountLoading && !viewerCountUpdatedAt
                  ? t('dashboard.viewerCountLoading')
                  : viewerCountUpdatedAt
                    ? t('dashboard.viewerCountLastUpdated', {
                        value: FormatOverviewRelativeTime(
                          viewerCountUpdatedAt,
                          locale,
                          t('dashboard.justNow'),
                        ),
                      })
                    : t('dashboard.viewerCountWaiting')}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground">
            <RefreshCw
              className={`h-3.5 w-3.5 ${viewerCountLoading && !viewerCountUpdatedAt ? 'animate-spin' : ''}`}
            />
            <span>
              {viewerCountUpdatedAt ? FormatOverviewClock(viewerCountUpdatedAt, formatPattern) : '--:--:--'}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <Clock3 className="h-4 w-4" />
            {t('dashboard.quickAddTitle')}
          </h3>
          <Button type="button" variant="outline" size="sm" onClick={onOpenDevices}>
            <MonitorSmartphone className="mr-1 h-4 w-4" />
            {t('dashboard.openDeviceManager')}
          </Button>
        </div>
        <AddActivityForm />
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <Clock3 className="h-4 w-4" />
              {t('dashboard.recentRecordsTitle')}
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              {t('dashboard.recentRecordsDescription')}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefreshRecentActivity}
            disabled={recentActivityUsageFetching}
          >
            {recentActivityUsageFetching ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 h-4 w-4" />
            )}
            {t('common.refresh')}
          </Button>
        </div>

        {recentActivityUsageLoading ? (
          <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
            {t('dashboard.recentRecordsLoading')}
          </div>
        ) : recentActivityUsage.length === 0 ? (
          <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
            {t('dashboard.recentRecordsEmpty')}
          </div>
        ) : (
          <div className="space-y-0">
            {recentActivityUsage.map((record, index) => {
              const recordTime = record.lastReportAt || record.updatedAt || record.startedAt
              const summary = BuildRecentRecordSummary(record, t('dashboard.noStatusDescription'))
              const isPersistentRecord =
                GetRecordPushMode(record) === 'active' && typeof record.id === 'number'
              const persistentRecordId = isPersistentRecord ? (record.id as number) : null
              const endingThisRecord =
                persistentRecordId !== null &&
                endingActivityPending &&
                endingActivityId === persistentRecordId

              return (
                <div
                  key={record.id}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-[88px_minmax(0,1fr)] sm:gap-4"
                >
                  <div className="hidden pt-1 text-right sm:block">
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {FormatOverviewClock(recordTime, formatPattern)}
                    </p>
                    <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                      {FormatOverviewDate(recordTime, formatPattern, t('common.unknownTime'))}
                    </p>
                  </div>

                  <div className="relative pb-5 pl-7 sm:pl-0">
                    {index !== recentActivityUsage.length - 1 ? (
                      <div className="absolute left-[7px] top-7 h-[calc(100%-1rem)] w-px bg-border sm:left-[7px]" />
                    ) : null}
                    <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border border-primary/20 bg-primary/12">
                      <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3 sm:ml-7">
                      <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground sm:hidden">
                        <span className="font-semibold tabular-nums text-foreground">
                          {FormatOverviewClock(recordTime, formatPattern)}
                        </span>
                        <span>{FormatOverviewDate(recordTime, formatPattern, t('common.unknownTime'))}</span>
                        <span>·</span>
                        <span>{FormatOverviewRelativeTime(recordTime, locale, t('dashboard.justNow'))}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-sm font-medium leading-6 text-foreground">{summary}</p>
                        <span className="hidden text-xs text-muted-foreground sm:inline">
                          {FormatOverviewRelativeTime(recordTime, locale, t('dashboard.justNow'))}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {record.device || t('dashboard.unknownDevice')}
                        {record.processName ? ` · ${record.processName}` : ''}
                      </p>
                      {isPersistentRecord ? (
                        <div className="mt-3">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button type="button" variant="outline" size="sm" disabled={endingThisRecord}>
                                {endingThisRecord ? (
                                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                ) : (
                                  <OctagonX className="mr-1 h-4 w-4" />
                                )}
                                {t('dashboard.endActivityNow')}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('dashboard.confirmEndActivityTitle')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('dashboard.confirmEndActivityDescription', { summary })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                  disabled={endingThisRecord}
                                  onClick={() =>
                                    persistentRecordId !== null
                                      ? void onEndActivity(persistentRecordId)
                                      : undefined
                                  }
                                >
                                  {endingThisRecord ? t('dashboard.endingActivity') : t('dashboard.confirmEnd')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
