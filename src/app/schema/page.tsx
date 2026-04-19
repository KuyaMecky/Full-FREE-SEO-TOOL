"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  FileCode,
  Copy,
  Check,
  Plus,
  X,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { HelpBanner } from "@/components/help-banner";
import { GUIDES } from "@/lib/guides";

type SchemaType =
  | "Article"
  | "FAQPage"
  | "Product"
  | "LocalBusiness"
  | "Organization"
  | "BreadcrumbList";

const TYPE_LABELS: Record<SchemaType, string> = {
  Article: "Article",
  FAQPage: "FAQ Page",
  Product: "Product",
  LocalBusiness: "Local Business",
  Organization: "Organization",
  BreadcrumbList: "Breadcrumb",
};

export default function SchemaPage() {
  const [type, setType] = useState<SchemaType>("Article");
  const [copied, setCopied] = useState(false);

  // Shared state buckets — simpler than per-type state
  const [article, setArticle] = useState({
    headline: "",
    description: "",
    authorName: "",
    imageUrl: "",
    datePublished: "",
    dateModified: "",
    url: "",
    publisherName: "",
    publisherLogo: "",
  });
  const [faq, setFaq] = useState<{ q: string; a: string }[]>([
    { q: "", a: "" },
    { q: "", a: "" },
  ]);
  const [product, setProduct] = useState({
    name: "",
    description: "",
    imageUrl: "",
    brand: "",
    sku: "",
    priceCurrency: "USD",
    price: "",
    availability: "InStock",
    url: "",
    reviewCount: "",
    ratingValue: "",
  });
  const [local, setLocal] = useState({
    name: "",
    url: "",
    telephone: "",
    streetAddress: "",
    city: "",
    region: "",
    postalCode: "",
    country: "US",
    priceRange: "$$",
    imageUrl: "",
  });
  const [org, setOrg] = useState({
    name: "",
    url: "",
    logoUrl: "",
    description: "",
    sameAs: [] as string[],
    newSameAs: "",
  });
  const [crumbs, setCrumbs] = useState<{ name: string; url: string }[]>([
    { name: "Home", url: "" },
    { name: "", url: "" },
  ]);

  const jsonLd = useMemo(() => buildJsonLd(type, {
    article,
    faq,
    product,
    local,
    org,
    crumbs,
  }), [type, article, faq, product, local, org, crumbs]);

  const copy = async () => {
    await navigator.clipboard.writeText(formatOutput(jsonLd));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        icon={FileCode}
        title="Schema Generator"
        accent="purple"
        description="Generate valid JSON-LD structured data for common schema.org types. Copy the output and paste it into a <script type=&quot;application/ld+json&quot;> tag in your page <head>."
      />
      <HelpBanner guideKey="schemaGen" guide={GUIDES.schemaGen} />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Schema type</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={type} onValueChange={(v) => setType(v as SchemaType)}>
            <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/40 p-1">
              {(Object.keys(TYPE_LABELS) as SchemaType[]).map((t) => (
                <TabsTrigger key={t} value={t} className="text-xs">
                  {TYPE_LABELS[t]}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="Article" className="mt-4">
              <ArticleForm value={article} onChange={setArticle} />
            </TabsContent>
            <TabsContent value="FAQPage" className="mt-4">
              <FaqForm items={faq} onChange={setFaq} />
            </TabsContent>
            <TabsContent value="Product" className="mt-4">
              <ProductForm value={product} onChange={setProduct} />
            </TabsContent>
            <TabsContent value="LocalBusiness" className="mt-4">
              <LocalForm value={local} onChange={setLocal} />
            </TabsContent>
            <TabsContent value="Organization" className="mt-4">
              <OrgForm value={org} onChange={setOrg} />
            </TabsContent>
            <TabsContent value="BreadcrumbList" className="mt-4">
              <BreadcrumbForm items={crumbs} onChange={setCrumbs} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Generated JSON-LD</CardTitle>
            <CardDescription>
              Validate with{" "}
              <a
                href="https://search.google.com/test/rich-results"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Google&apos;s Rich Results Test
                <ExternalLink className="h-3 w-3" />
              </a>{" "}
              before shipping.
            </CardDescription>
          </div>
          <Button onClick={copy} variant="outline" size="sm" className="gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted/40 border border-border rounded-md p-4 text-xs overflow-x-auto font-mono leading-relaxed">
            {formatOutput(jsonLd)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

// ───────── Form components ─────────

function Field({
  label,
  id,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1"
      />
    </div>
  );
}

function ArticleForm({
  value,
  onChange,
}: {
  value: typeof ArticleShape;
  onChange: (v: typeof ArticleShape) => void;
}) {
  const set = (k: keyof typeof ArticleShape) => (v: string) =>
    onChange({ ...value, [k]: v });
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Headline" id="a-headline" value={value.headline} onChange={set("headline")} placeholder="How to ..." />
      <Field label="Article URL" id="a-url" value={value.url} onChange={set("url")} placeholder="https://..." />
      <Field label="Author name" id="a-author" value={value.authorName} onChange={set("authorName")} />
      <Field label="Image URL" id="a-image" value={value.imageUrl} onChange={set("imageUrl")} />
      <Field label="Date published" id="a-published" type="date" value={value.datePublished} onChange={set("datePublished")} />
      <Field label="Date modified" id="a-modified" type="date" value={value.dateModified} onChange={set("dateModified")} />
      <Field label="Publisher name" id="a-pubname" value={value.publisherName} onChange={set("publisherName")} />
      <Field label="Publisher logo URL" id="a-publogo" value={value.publisherLogo} onChange={set("publisherLogo")} />
      <div className="md:col-span-2">
        <Label htmlFor="a-desc">Description</Label>
        <Textarea
          id="a-desc"
          value={value.description}
          onChange={(e) => set("description")(e.target.value)}
          rows={3}
          className="mt-1"
        />
      </div>
    </div>
  );
}

function FaqForm({
  items,
  onChange,
}: {
  items: { q: string; a: string }[];
  onChange: (v: { q: string; a: string }[]) => void;
}) {
  const update = (i: number, k: "q" | "a", v: string) => {
    const copy = [...items];
    copy[i] = { ...copy[i], [k]: v };
    onChange(copy);
  };
  const add = () => onChange([...items, { q: "", a: "" }]);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div
          key={i}
          className="border border-border rounded-md p-4 space-y-3 relative"
        >
          <button
            type="button"
            onClick={() => remove(i)}
            className="absolute top-2 right-2 rounded hover:bg-muted p-1"
            aria-label="Remove"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
          <div>
            <Label>Question {i + 1}</Label>
            <Input
              value={item.q}
              onChange={(e) => update(i, "q", e.target.value)}
              className="mt-1"
              placeholder="What is ...?"
            />
          </div>
          <div>
            <Label>Answer</Label>
            <Textarea
              value={item.a}
              onChange={(e) => update(i, "a", e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={add} className="gap-2">
        <Plus className="h-4 w-4" />
        Add question
      </Button>
    </div>
  );
}

function ProductForm({
  value,
  onChange,
}: {
  value: typeof ProductShape;
  onChange: (v: typeof ProductShape) => void;
}) {
  const set = (k: keyof typeof ProductShape) => (v: string) =>
    onChange({ ...value, [k]: v });
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Product name" id="p-name" value={value.name} onChange={set("name")} />
      <Field label="Brand" id="p-brand" value={value.brand} onChange={set("brand")} />
      <Field label="Product URL" id="p-url" value={value.url} onChange={set("url")} />
      <Field label="Image URL" id="p-image" value={value.imageUrl} onChange={set("imageUrl")} />
      <Field label="SKU" id="p-sku" value={value.sku} onChange={set("sku")} />
      <Field label="Availability" id="p-avail" value={value.availability} onChange={set("availability")} placeholder="InStock" />
      <Field label="Currency" id="p-curr" value={value.priceCurrency} onChange={set("priceCurrency")} placeholder="USD" />
      <Field label="Price" id="p-price" value={value.price} onChange={set("price")} placeholder="29.99" />
      <Field label="Rating value (optional)" id="p-rating" value={value.ratingValue} onChange={set("ratingValue")} placeholder="4.5" />
      <Field label="Review count (optional)" id="p-reviews" value={value.reviewCount} onChange={set("reviewCount")} placeholder="128" />
      <div className="md:col-span-2">
        <Label>Description</Label>
        <Textarea
          value={value.description}
          onChange={(e) => set("description")(e.target.value)}
          rows={3}
          className="mt-1"
        />
      </div>
    </div>
  );
}

function LocalForm({
  value,
  onChange,
}: {
  value: typeof LocalShape;
  onChange: (v: typeof LocalShape) => void;
}) {
  const set = (k: keyof typeof LocalShape) => (v: string) =>
    onChange({ ...value, [k]: v });
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Business name" id="l-name" value={value.name} onChange={set("name")} />
      <Field label="URL" id="l-url" value={value.url} onChange={set("url")} />
      <Field label="Telephone" id="l-tel" value={value.telephone} onChange={set("telephone")} />
      <Field label="Image URL" id="l-image" value={value.imageUrl} onChange={set("imageUrl")} />
      <Field label="Street" id="l-street" value={value.streetAddress} onChange={set("streetAddress")} />
      <Field label="City" id="l-city" value={value.city} onChange={set("city")} />
      <Field label="Region / state" id="l-region" value={value.region} onChange={set("region")} />
      <Field label="Postal code" id="l-postal" value={value.postalCode} onChange={set("postalCode")} />
      <Field label="Country" id="l-country" value={value.country} onChange={set("country")} placeholder="US" />
      <Field label="Price range" id="l-price" value={value.priceRange} onChange={set("priceRange")} placeholder="$$" />
    </div>
  );
}

function OrgForm({
  value,
  onChange,
}: {
  value: typeof OrgShape;
  onChange: (v: typeof OrgShape) => void;
}) {
  const set = (k: keyof typeof OrgShape) => (v: string) =>
    onChange({ ...value, [k]: v });
  const addSameAs = () => {
    const v = value.newSameAs.trim();
    if (!v) return;
    onChange({ ...value, sameAs: [...value.sameAs, v], newSameAs: "" });
  };
  const removeSameAs = (i: number) =>
    onChange({ ...value, sameAs: value.sameAs.filter((_, idx) => idx !== i) });
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Organization name" id="o-name" value={value.name} onChange={set("name")} />
      <Field label="URL" id="o-url" value={value.url} onChange={set("url")} />
      <Field label="Logo URL" id="o-logo" value={value.logoUrl} onChange={set("logoUrl")} />
      <div className="md:col-span-2">
        <Label>Description</Label>
        <Textarea
          value={value.description}
          onChange={(e) => set("description")(e.target.value)}
          rows={2}
          className="mt-1"
        />
      </div>
      <div className="md:col-span-2">
        <Label>Social profiles (sameAs URLs)</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={value.newSameAs}
            onChange={(e) => set("newSameAs")(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSameAs();
              }
            }}
            placeholder="https://twitter.com/..."
          />
          <Button type="button" variant="outline" onClick={addSameAs}>
            Add
          </Button>
        </div>
        {value.sameAs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {value.sameAs.map((u, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1 font-normal">
                {u}
                <button
                  type="button"
                  onClick={() => removeSameAs(i)}
                  className="rounded hover:bg-foreground/10 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BreadcrumbForm({
  items,
  onChange,
}: {
  items: { name: string; url: string }[];
  onChange: (v: { name: string; url: string }[]) => void;
}) {
  const update = (i: number, k: "name" | "url", v: string) => {
    const copy = [...items];
    copy[i] = { ...copy[i], [k]: v };
    onChange(copy);
  };
  const add = () => onChange([...items, { name: "", url: "" }]);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="text-sm font-mono text-muted-foreground pt-2.5 w-4">
            {i + 1}
          </div>
          <Input
            value={item.name}
            onChange={(e) => update(i, "name", e.target.value)}
            placeholder="Name"
          />
          <Input
            value={item.url}
            onChange={(e) => update(i, "url", e.target.value)}
            placeholder="URL"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="rounded hover:bg-muted p-2"
            aria-label="Remove"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={add} className="gap-2">
        <Plus className="h-4 w-4" />
        Add crumb
      </Button>
    </div>
  );
}

// ───────── Shape type helpers (for TS inference) ─────────

const ArticleShape = {
  headline: "",
  description: "",
  authorName: "",
  imageUrl: "",
  datePublished: "",
  dateModified: "",
  url: "",
  publisherName: "",
  publisherLogo: "",
};

const ProductShape = {
  name: "",
  description: "",
  imageUrl: "",
  brand: "",
  sku: "",
  priceCurrency: "USD",
  price: "",
  availability: "InStock",
  url: "",
  reviewCount: "",
  ratingValue: "",
};

const LocalShape = {
  name: "",
  url: "",
  telephone: "",
  streetAddress: "",
  city: "",
  region: "",
  postalCode: "",
  country: "US",
  priceRange: "$$",
  imageUrl: "",
};

const OrgShape = {
  name: "",
  url: "",
  logoUrl: "",
  description: "",
  sameAs: [] as string[],
  newSameAs: "",
};

// ───────── JSON-LD builder ─────────

function buildJsonLd(
  type: SchemaType,
  d: {
    article: typeof ArticleShape;
    faq: { q: string; a: string }[];
    product: typeof ProductShape;
    local: typeof LocalShape;
    org: typeof OrgShape;
    crumbs: { name: string; url: string }[];
  }
): Record<string, unknown> {
  const omit = <T extends object>(obj: T): Partial<T> => {
    const out: Partial<T> = {};
    for (const [k, v] of Object.entries(obj) as [keyof T, unknown][]) {
      if (
        v !== "" &&
        v !== null &&
        v !== undefined &&
        !(Array.isArray(v) && v.length === 0)
      ) {
        (out as Record<string, unknown>)[k as string] = v;
      }
    }
    return out;
  };

  if (type === "Article") {
    const a = d.article;
    return omit({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: a.headline,
      description: a.description,
      image: a.imageUrl || undefined,
      author: a.authorName
        ? { "@type": "Person", name: a.authorName }
        : undefined,
      datePublished: a.datePublished || undefined,
      dateModified: a.dateModified || a.datePublished || undefined,
      mainEntityOfPage: a.url
        ? { "@type": "WebPage", "@id": a.url }
        : undefined,
      publisher:
        a.publisherName
          ? omit({
              "@type": "Organization",
              name: a.publisherName,
              logo: a.publisherLogo
                ? { "@type": "ImageObject", url: a.publisherLogo }
                : undefined,
            })
          : undefined,
    });
  }

  if (type === "FAQPage") {
    const items = d.faq.filter((f) => f.q.trim() && f.a.trim());
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.a,
        },
      })),
    };
  }

  if (type === "Product") {
    const p = d.product;
    const offers: Record<string, unknown> | undefined =
      p.price || p.availability
        ? omit({
            "@type": "Offer",
            priceCurrency: p.priceCurrency || "USD",
            price: p.price || undefined,
            availability: p.availability
              ? `https://schema.org/${p.availability}`
              : undefined,
            url: p.url || undefined,
          })
        : undefined;
    const aggregateRating: Record<string, unknown> | undefined =
      p.ratingValue && p.reviewCount
        ? {
            "@type": "AggregateRating",
            ratingValue: p.ratingValue,
            reviewCount: p.reviewCount,
          }
        : undefined;
    return omit({
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      description: p.description,
      image: p.imageUrl || undefined,
      brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
      sku: p.sku || undefined,
      offers,
      aggregateRating,
    });
  }

  if (type === "LocalBusiness") {
    const l = d.local;
    return omit({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: l.name,
      url: l.url || undefined,
      telephone: l.telephone || undefined,
      image: l.imageUrl || undefined,
      priceRange: l.priceRange || undefined,
      address: omit({
        "@type": "PostalAddress",
        streetAddress: l.streetAddress,
        addressLocality: l.city,
        addressRegion: l.region,
        postalCode: l.postalCode,
        addressCountry: l.country,
      }),
    });
  }

  if (type === "Organization") {
    const o = d.org;
    return omit({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: o.name,
      url: o.url || undefined,
      logo: o.logoUrl || undefined,
      description: o.description || undefined,
      sameAs: o.sameAs.length > 0 ? o.sameAs : undefined,
    });
  }

  if (type === "BreadcrumbList") {
    const items = d.crumbs.filter((c) => c.name.trim());
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        item: c.url || undefined,
      })),
    };
  }

  return {};
}

function formatOutput(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}
