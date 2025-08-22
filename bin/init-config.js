#!/usr/bin/env node

const sampleConfig = {
    tailwind: {
        include: [
            {
                src: "app/code",
            },
            {
                src: "vendor/hyva-themes/magento2-default-theme",
            },
        ],
        exclude: [],
    },
};

fs.writeFile(
    path.join(cwd(), "hyva.config.json"),
    JSON.stringify(sampleConfig, null, 2)
);
