import {useTranslations} from 'use-intl';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Separator} from '@/components/ui/separator';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {ScrollArea} from '@/components/ui/scroll-area';
import {AlertTriangle, Copy, RefreshCw, RotateCcw} from 'lucide-react';
import {useRouteError, useNavigate, isRouteErrorResponse} from 'react-router';
import {useState} from 'react';

export default function RouteErrorScreen() {
    const t = useTranslations('route-error');
    const routeError = useRouteError();
    const navigate = useNavigate();
    const [timestamp] = useState(() => new Date());

    const err: Error = isRouteErrorResponse(routeError)
        ? Object.assign(new Error(routeError.statusText || 'Route error'), {
              name: `${routeError.status} ${routeError.statusText}`,
              stack: JSON.stringify(routeError.data, null, 2),
          })
        : routeError instanceof Error
          ? routeError
          : new Error(String(routeError));

    const handleCopy = () => {
        const report = [
            `Time: ${timestamp.toISOString()}`,
            `URL: ${window.location.href}`,
            `User agent: ${navigator.userAgent}`,
            ``,
            `Message: ${err.message}`,
            err.name ? `Type: ${err.name}` : '',
            ``,
            `Stack trace:`,
            err.stack ?? '(none)',
        ]
            .filter(Boolean)
            .join('\n');

        void navigator.clipboard?.writeText(report);
    };

    return (
        <div className="fixed inset-0 z-3 overflow-y-auto md:p-4 sm:p-8">
            <div className="mx-auto max-w-3xl">
                <Card className="bg-card border-0 md:border md:border-destructive/30">
                    <CardHeader className="border-b">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 rounded-full bg-destructive/10 p-2">
                                    <AlertTriangle className="h-5 w-5 text-destructive" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">
                                        {err.name || t('title')}
                                    </CardTitle>
                                    <p className="mt-1 text-sm text-foreground">
                                        {t('subtitle')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <Field label={t('field_message')}>
                            <p className="font-mono text-sm text-foreground">
                                {err.message}
                            </p>
                        </Field>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <Field label={t('field_time')}>
                                <p className="font-mono text-xs text-foreground">
                                    {timestamp.toLocaleString()}
                                </p>
                            </Field>
                            <Field label={t('field_url')}>
                                <p className="font-mono text-xs text-foreground">
                                    {window.location.href}
                                </p>
                            </Field>
                            <Field label={t('field_user_agent')}>
                                <p className="font-mono text-xs text-foreground">
                                    {navigator.userAgent}
                                </p>
                            </Field>
                        </div>

                        <Separator />

                        <Accordion
                            type="multiple"
                            defaultValue={['stack']}
                            className="w-full"
                        >
                            {err.stack && (
                                <AccordionItem value="stack">
                                    <AccordionTrigger className="text-sm font-medium">
                                        {t('stack_trace')}
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <ScrollArea className="h-64 w-full rounded-md border">
                                            <pre className="whitespace-pre-wrap wrap-break-word p-3 font-mono text-xs text-foreground">
                                                {err.stack}
                                            </pre>
                                        </ScrollArea>
                                    </AccordionContent>
                                </AccordionItem>
                            )}
                        </Accordion>

                        <Separator />

                        <div className="flex flex-wrap flex-col md:flex-row gap-2">
                            <Button
                                onClick={() => void navigate('/')}
                                variant="outline"
                            >
                                <RotateCcw className="h-4 w-4 cursor-pointer" />
                                {t('go_home')}
                            </Button>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                            >
                                <RefreshCw className="h-4 w-4 cursor-pointer" />
                                {t('reload_page')}
                            </Button>
                            <Button onClick={handleCopy} variant="outline">
                                <Copy className="h-4 w-4 cursor-pointer" />
                                {t('copy_report')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function Field({label, children}: {label: string; children: React.ReactNode}) {
    return (
        <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground">
                {label}
            </p>
            {children}
        </div>
    );
}
