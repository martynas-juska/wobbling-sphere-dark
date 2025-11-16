// import restart from 'vite-plugin-restart'
// import glsl from 'vite-plugin-glsl'

// export default {
//     root: 'src/',
//     publicDir: '../static/',
//     base: './',
//     server:
//     {
//         host: true, // Open to local network and display URL
//         open: !('SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env) // Open if it's not a CodeSandbox
//     },
//     build:
//     {
//         outDir: '../dist', // Output in the dist/ folder
//         emptyOutDir: true, // Empty the folder first
//         sourcemap: true // Add sourcemap
//     },
//     plugins:
//     [
//         restart({ restart: [ '../static/**', ] }), // Restart server on static file change
//         glsl() // Handle shader files
//     ]
// }

// import restart from 'vite-plugin-restart'
// import glsl from 'vite-plugin-glsl'

// export default {
//     root: 'src/',
//     publicDir: '../static/',
//     base: './',
//     server: {
//         host: true,
//         open: !('SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env)
//     },
//     build: {
//         outDir: '../dist',
//         emptyOutDir: true,
//         sourcemap: false,
//         minify: 'esbuild', // CHANGED: Use esbuild (built into Vite)
//         rollupOptions: {
//             input: './src/script.js', // FIXED: Removed 'main' wrapper
//             output: {
//                 entryFileNames: 'wobble-sphere.js',
//                 format: 'es',
//                 inlineDynamicImports: true
//             }
//         }
//     },
//     plugins: [
//         restart({ restart: ['../static/**'] }),
//         glsl()
//     ]
// }

import restart from 'vite-plugin-restart'
import glsl from 'vite-plugin-glsl'

export default {
    root: 'src/',
    publicDir: '../static/',
    base: './',
    server: {
        host: true,
        open: !('SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env)
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: false,
        minify: 'esbuild',
        rollupOptions: {
            input: './src/script.js',
            output: {
                entryFileNames: 'wobble-sphere.js',
                format: 'es',
                inlineDynamicImports: true
            },
            // DON'T externalize anything - bundle it all
            external: []
        }
    },
    plugins: [
        restart({ restart: ['../static/**'] }),
        glsl()
    ]
}