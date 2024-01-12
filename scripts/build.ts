import path from "path";
import fs from "fs/promises";
import { icon } from "@fortawesome/fontawesome-svg-core";
import sharp from "sharp";

type IconDef =
    | string
    | {
          source: "fa";
          type?: "solid" | "outline";
          name: string;
      }
    | {
          source: "trh";
          name: string;
      }
    | {
          source: "gi";
          name: `${string}/${string}`;
      };

const ICONS: { [key: string]: IconDef } = {
    "actions/power": "PowerOff",
    "actions/refresh": "Refresh",
    "actions/close": "XmarkLarge",
    "actions/settings": "Gear",
    "actions/add": "Add",
    "actions/subtract": "Subtract",
    "actions/trash": "Trash",
    "actions/search": "MagnifyingGlass",
    "actions/copy": "Copy",
    "actions/paste": "Paste",
    "actions/cut": "Scissors",
    "actions/save": "FloppyDisk",

    "status/illuminated": "Lightbulb",
    "status/darkened": "LightbulbSlash",
    "status/locked": "Lock",
    "status/noLock": {
        source: "trh",
        name: "NoLock",
    },
    "status/unlocked": "LockOpen",
    "status/hidden": "EyeSlash",
    "status/visible": "Eye",

    "media/play": "Play",
    "media/reverse": {
        source: "trh",
        name: "Reverse",
    },
    "media/stop": "Stop",
    "media/pause": "Pause",
    "media/shuffle": "Shuffle",
    "media/noShuffle": {
        source: "trh",
        name: "NoShuffle",
    },
    "media/noRepeat": {
        source: "trh",
        name: "NoRepeat",
    },
    "media/backward": "Backward",
    "media/forward": "Forward",
    "media/repeat": "Repeat",
    "media/repeatOnce": "Repeat1",
    "media/first": "BackwardFast",
    "media/last": "ForwardFast",
    "media/stepForward": "ForwardStep",
    "media/stepBackward": "BackwardStep",

    "format/listOL": "ListOl",
    "format/listUL": "ListUl",

    "window/maximize": "WindowMaximize",
    "window/minimize": "WindowMinimize",
    "window/expand": "UpRightFromSquare",
    "window/compress": {
        source: "trh",
        name: "ArrowDownLeftToSquare",
    },
    "window/restore": "WindowRestore",

    "arrows/maximize": "Maximize",
    "arrows/minimize": "Minimize",
    "arrows/caretLeft": "CaretLeft",
    "arrows/caretRight": "CaretRight",
    "arrows/caretUp": "CaretUp",
    "arrows/caretDown": "CaretDown",

    "arrows/chevronLeft": "ChevronLeft",
    "arrows/chevronRight": "ChevronRight",
    "arrows/chevronUp": "ChevronUp",
    "arrows/chevronDown": "ChevronDown",

    "arrows/arrowLeft": "ArrowLeft",
    "arrows/arrowRight": "ArrowRight",
    "arrows/arrowUp": "ArrowUp",
    "arrows/arrowDown": "ArrowDown",

    "notices/error": {
        source: "trh",
        name: "Error",
    },
    "notices/fatal": {
        source: "trh",
        name: "Fatal",
    },
    "notices/info": {
        source: "trh",
        name: "Info",
    },
    "notices/query": {
        source: "trh",
        name: "Query",
    },
    "notices/warning": {
        source: "trh",
        name: "Warning",
    },
} as const;

const WHITE_TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

const SIZE = 62;
const PADDING = 1;

const doIcon = async (key: string) => {
    const target = path.resolve("hosted", `${key}.png`);

    await fs.mkdir(path.dirname(target), { recursive: true });
    const d = ICONS[key];
    const iconDef = {
        source: typeof d === "string" ? "fa" : d.source,
        name: typeof d === "string" ? d : d.name,
        type: typeof d === "string" || !("type" in d) ? "solid" : d.type ?? "solid",
    };

    if (iconDef.source === "fa") {
        const lib = iconDef.type === "solid" ? "@fortawesome/sharp-solid-svg-icons" : "@fortawesome/sharp-regular-svg-icons";
        await sharp(Buffer.from(icon(require(lib)[`fa${iconDef.name}`], { styles: { color: "white" } }).html[0]))
            .resize({ width: SIZE, height: SIZE, fit: "contain", background: WHITE_TRANSPARENT })
            .extend({ left: PADDING, right: PADDING, top: PADDING, bottom: PADDING, background: WHITE_TRANSPARENT })
            .png()
            .toFile(target);
    } else if (iconDef.source === "trh") {
        await sharp(path.resolve(`./custom/trh${iconDef.name}.svg`))
            .resize({ width: SIZE, height: SIZE, fit: "contain", background: WHITE_TRANSPARENT })
            .extend({ left: PADDING, right: PADDING, top: PADDING, bottom: PADDING, background: WHITE_TRANSPARENT })
            .png()
            .toFile(target);
    } else if (iconDef.source === "gi") {
        const icon = await getFromGameIcon(iconDef.name);
        await sharp(Buffer.from(icon))
            .resize({ width: SIZE, height: SIZE, fit: "contain", background: WHITE_TRANSPARENT })
            .extend({ left: PADDING, right: PADDING, top: PADDING, bottom: PADDING, background: WHITE_TRANSPARENT })
            .png()
            .toFile(target);
    }
};

const run = async () => {
    const result: { [key: string]: { [key: string]: string } } = {};
    await Promise.all(
        Object.keys(ICONS).map(async (key) => {
            await doIcon(key);
            const [category, name] = key.split("/");
            result[category] = result?.[category] ?? {};
            result[category][name] = `https://raw.githubusercontent.com/RobMayer/ttpg-trh-icons/main/hosted/${category}/${name}.png`;
        }),
    );
    await fs.mkdir(path.resolve("./tmp"), { recursive: true });
    await fs.writeFile(path.resolve("./tmp/index.ts"), `export default ${JSON.stringify(result)};`);
};

run()
    .then(() => {
        console.log("done");
    })
    .catch((e) => {
        console.error(e);
    });

const getFromGameIcon = async (name: string) => {
    const svg = await fetch(`https://raw.githubusercontent.com/game-icons/icons/master/${name}.svg`);
    if (svg.ok) {
        const res = await svg.text();
        return res.replace(`<path d="M0 0h512v512H0z"/>`, "");
    }
    throw svg.statusText;
};
