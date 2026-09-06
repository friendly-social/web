import {defineConfig, type Plugin} from 'vite';
import react from '@vitejs/plugin-react';
import manifest from './package.json';
import {execFileSync} from 'child_process';
import {VitePWA} from 'vite-plugin-pwa';

function run(cmd: string, args: string[]) {
    try {
        return execFileSync(cmd, args).toString().trim();
    } catch (error) {
        if (
            error &&
            typeof error === 'object' &&
            'stdout' in error &&
            Buffer.isBuffer(error.stdout)
        ) {
            const stdout = error.stdout.toString().trim();
            if (stdout) return stdout;
        }
        throw error;
    }
}

function getGitBranchFormatted(): string | null {
    try {
        const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
        return branch.replace(/[^0-9A-Za-z-]/g, '-');
    } catch (error) {
        console.error('Error occurred while fetching git branch:', error);
        return null;
    }
}

function getCommitHash(): string | null {
    try {
        return run('git', ['rev-parse', '--short', 'HEAD']);
    } catch (error) {
        console.error('Error occurred while fetching commit hash:', error);
        return null;
    }
}

function appVersionPlugin(): Plugin {
    const appVersion = manifest.version;
    const gitBranchName = getGitBranchFormatted();
    const gitCommitHash = getCommitHash();

    const longVersionName = gitBranchName
        ? `${appVersion}-${gitBranchName}+${gitCommitHash}`
        : `${appVersion}-release`;

    return {
        name: 'app-version',
        config: () => ({
            define: {
                'import.meta.env.APP_VERSION': JSON.stringify(longVersionName),
            },
        }),
    };
}

export default defineConfig({
    plugins: [
        react(),
        appVersionPlugin(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['banner-light.svg', 'banner-dark.svg'],
            manifest: {
                name: 'Friendly: Private Social Network',
                // TODO: Wait until VitePWA allows localization
                // name_localized: {
                //     'ru': 'Friendly: приватная социальная сеть',
                // },
                short_name: 'Friendly',
                description:
                    'They say you are connected to anyone with 6 degrees of separation. But instead of chasing the entire world, why not try to focus on expanding the network you already have? Friendly is a private social network built on real connections.',
                // TODO: Wait until VitePWA allows localization
                // description_localized: {
                //     'ru': 'Говорят, все люди в мире разделены всего шестью рукопожатиями. Но вместо того чтобы пытаться охватить весь мир, почему бы не уделить внимание расширению уже существующего круга знакомств? Friendly – это приватная социальная сеть, построенная на реальных связях.',
                // },
                theme_color: '#007aff',
                background_color: '#222222',
                icons: [
                    {
                        src: 'pwa-icon.svg',
                        type: 'image/svg+xml',
                        sizes: 'any',
                        purpose: 'any',
                    },
                    {
                        src: 'pwa-icon-maskable.svg',
                        type: 'image/svg+xml',
                        sizes: 'any',
                        purpose: 'maskable',
                    },
                    {
                        src: 'pwa-icon-monochrome.svg',
                        type: 'image/svg+xml',
                        sizes: 'any',
                        purpose: 'monochrome',
                    },
                ],
            },
            // devOptions: {
            //     enabled: true,
            // },
        }),
    ],
    resolve: {
        alias: {
            '@': '/src',
        },
    },
});
