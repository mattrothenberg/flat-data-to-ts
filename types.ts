// To parse this data:
//
//   import { Convert } from "./file";
//
//   const boyBandDatum = Convert.toBoyBandDatum(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface BoyBandDatum {
    band:         string;
    name:         string;
    dob:          string;
    hair_color:   HairColor;
    hair_frosted: HairFrosted;
    hair_length:  HairLength;
    hair_style:   string;
    eyes:         Eyes;
    facial_hair:  FacialHair;
    accessories:  string;
    top_style:    string;
    bottom_style: BottomStyle;
    height:       string;
    skin:         Skin;
    instrument:   Instrument;
    shirt_color:  string;
    jacket_color: string;
    bottom_color: BottomColor;
}

export enum BottomColor {
    Black = "black",
    Gray = "gray",
    Green = "green",
    LightBlue = "light blue",
    LightGray = "light gray",
    NavyBlue = "navy blue",
    Red = "red",
    Tan = "tan",
    White = "white",
    Yellow = "yellow",
}

export enum BottomStyle {
    AcidWashJeans = "acid wash jeans",
    CargoPants = "cargo pants",
    DressPants = "dress pants",
    Jeans = "jeans",
    Overalls = "overalls",
    Shorts = "shorts",
    SweatPants = "sweat pants",
}

export enum Eyes {
    Blue = "blue",
    Brown = "brown",
    DifficultToTell = "difficult to tell",
    Empty = "",
    Gray = "Gray",
    Green = "green",
    Hazel = "hazel",
    UnknownCanTTell = "unknown/can't tell",
}

export enum FacialHair {
    Beard = "beard",
    BeardMustache = "beard, mustache",
    BeardMustacheSoulPatch = "beard, mustache, soul patch",
    Empty = "",
    FiveOClockShadow = "five o'clock shadow",
    Goatee = "goatee",
    Mustache = "mustache",
    MustacheFiveOClockShadow = "mustache, five o'clock shadow",
    MustacheGoatee = "mustache, goatee",
    MustacheSoulPatch = "mustache, soul patch",
    Sideburns = "sideburns",
}

export enum HairColor {
    Black = "black",
    Blonde = "blonde",
    Blue = "blue",
    Brown = "brown",
    Empty = "",
    Green = "green",
    Red = "red",
    Silver = "silver",
    StrawberryBlonde = "strawberry blonde",
}

export enum HairFrosted {
    Empty = "",
    Green = "green",
    No = "no",
    Red = "red",
    Yes = "yes",
}

export enum HairLength {
    Empty = "",
    Long = "long",
    Medium = "medium",
    Short = "short",
}

export enum Instrument {
    Bass = "bass",
    Drums = "drums",
    Empty = "",
    Guitar = "guitar",
    Keyboard = "keyboard",
    Piano = "piano",
    Tambourine = "tambourine",
}

export enum Skin {
    Dark = "dark",
    Light = "light",
    Medium = "medium",
    MediumDark = "medium-dark",
    MediumLight = "medium-light",
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toBoyBandDatum(json: string): BoyBandDatum[] {
        return cast(JSON.parse(json), a(r("BoyBandDatum")));
    }

    public static boyBandDatumToJson(value: BoyBandDatum[]): string {
        return JSON.stringify(uncast(value, a(r("BoyBandDatum"))), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any = ''): never {
    if (key) {
        throw Error(`Invalid value for key "${key}". Expected type ${JSON.stringify(typ)} but got ${JSON.stringify(val)}`);
    }
    throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`, );
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases, val);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue("array", val);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue("Date", val);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue("object", val);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, prop.key);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val);
    }
    if (typ === false) return invalidValue(typ, val);
    while (typeof typ === "object" && typ.ref !== undefined) {
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "BoyBandDatum": o([
        { json: "band", js: "band", typ: "" },
        { json: "name", js: "name", typ: "" },
        { json: "dob", js: "dob", typ: "" },
        { json: "hair_color", js: "hair_color", typ: r("HairColor") },
        { json: "hair_frosted", js: "hair_frosted", typ: r("HairFrosted") },
        { json: "hair_length", js: "hair_length", typ: r("HairLength") },
        { json: "hair_style", js: "hair_style", typ: "" },
        { json: "eyes", js: "eyes", typ: r("Eyes") },
        { json: "facial_hair", js: "facial_hair", typ: r("FacialHair") },
        { json: "accessories", js: "accessories", typ: "" },
        { json: "top_style", js: "top_style", typ: "" },
        { json: "bottom_style", js: "bottom_style", typ: r("BottomStyle") },
        { json: "height", js: "height", typ: "" },
        { json: "skin", js: "skin", typ: r("Skin") },
        { json: "instrument", js: "instrument", typ: r("Instrument") },
        { json: "shirt_color", js: "shirt_color", typ: "" },
        { json: "jacket_color", js: "jacket_color", typ: "" },
        { json: "bottom_color", js: "bottom_color", typ: r("BottomColor") },
    ], false),
    "BottomColor": [
        "black",
        "gray",
        "green",
        "light blue",
        "light gray",
        "navy blue",
        "red",
        "tan",
        "white",
        "yellow",
    ],
    "BottomStyle": [
        "acid wash jeans",
        "cargo pants",
        "dress pants",
        "jeans",
        "overalls",
        "shorts",
        "sweat pants",
    ],
    "Eyes": [
        "blue",
        "brown",
        "difficult to tell",
        "",
        "Gray",
        "green",
        "hazel",
        "unknown/can't tell",
    ],
    "FacialHair": [
        "beard",
        "beard, mustache",
        "beard, mustache, soul patch",
        "",
        "five o'clock shadow",
        "goatee",
        "mustache",
        "mustache, five o'clock shadow",
        "mustache, goatee",
        "mustache, soul patch",
        "sideburns",
    ],
    "HairColor": [
        "black",
        "blonde",
        "blue",
        "brown",
        "",
        "green",
        "red",
        "silver",
        "strawberry blonde",
    ],
    "HairFrosted": [
        "",
        "green",
        "no",
        "red",
        "yes",
    ],
    "HairLength": [
        "",
        "long",
        "medium",
        "short",
    ],
    "Instrument": [
        "bass",
        "drums",
        "",
        "guitar",
        "keyboard",
        "piano",
        "tambourine",
    ],
    "Skin": [
        "dark",
        "light",
        "medium",
        "medium-dark",
        "medium-light",
    ],
};
