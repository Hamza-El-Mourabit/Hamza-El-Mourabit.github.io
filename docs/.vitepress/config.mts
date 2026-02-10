import { defineConfig } from 'vitepress'

export default defineConfig({
    base: '/hamzaelmourabit.github.io/',
    title: "Hamza's Pwn Lab",
    description: "Cybersecurity & CTF Exploitation - Expert Write-ups",
    srcDir: 'docs',
    themeConfig: {
        logo: '/logo.png',
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Write-ups', link: '/posts/dirty-laundry' },
            { text: 'About', link: '/about' }
        ],
        sidebar: [
            {
                text: 'CTF Write-ups',
                items: [
                    { text: 'Dirty Laundry (Pwn)', link: '/posts/dirty-laundry' }
                ]
            }
        ],
        socialLinks: [
            { icon: 'github', link: 'https://github.com' }
        ],
        footer: {
            message: 'Released under the MIT License.',
            copyright: 'Copyright © 2026-present Hamza'
        },
        search: {
            provider: 'local'
        }
    },
    appearance: true
})
