"use client";

import { motion } from "framer-motion";
import { ArrowRight, Bitcoin, Sparkles, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { mockNFTs, mockCollections, mockCreators, platformStats } from "@/lib/mock-data";
import { formatNumber, formatPercentChange, formatStx } from "@/lib/utils";

export default function Home() {
  const trending = mockNFTs.slice(0, 6);
  const recent = mockNFTs.slice(2, 8);
  const topCollections = mockCollections.slice(0, 5);
  const topCreators = mockCreators.slice(0, 4);

  return (
    <div className="relative">
      {/* Background atmosphere */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-bg-primary via-bg-primary to-bg-secondary opacity-95" />
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-neon-purple/20 blur-3xl" />
        <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-neon-cyan/20 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        {/* Hero */}
        <section className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-center">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-neon-cyan/30 bg-bg-card/60 px-3 py-1 text-[11px] font-medium text-text-secondary backdrop-blur"
            >
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-neon-green" />
              LIVE ON STACKS — SECURED BY BITCOIN
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
            >
              <span className="gradient-text block">Create. Mint. Trade.</span>
              <span className="mt-2 block text-text-secondary">
                AI destekli NFT&apos;ler, Bitcoin ile güvence altında.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="max-w-xl text-sm text-text-secondary"
            >
              DALL·E 3 ve Stable Diffusion ile tek satır kod yazmadan NFT oluştur,
              Stacks üzerinde mint et ve yalnızca %1 platform ücretiyle STX karşılığında
              alım-satım yap.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="flex flex-wrap items-center gap-4"
            >
              <Link href="/create" className="btn-primary inline-flex items-center gap-2">
                AI Studio&apos;ya Başla
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/explore"
                className="btn-secondary inline-flex items-center gap-2 text-xs"
              >
                Pazarı Keşfet
              </Link>
            </motion.div>

            {/* Live stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
              className="grid gap-3 text-xs text-text-secondary sm:grid-cols-4"
            >
              <StatPill label="Mint edilen NFT" value={formatNumber(platformStats.totalNftsMinted)} />
              <StatPill
                label="Toplam hacim"
                value={formatStx(platformStats.totalVolumeStx * 1_000_000, 0)}
              />
              <StatPill
                label="Aktif yaratıcı"
                value={formatNumber(platformStats.activeCreators)}
              />
              <StatPill
                label="Platform taban fiyatı"
                value={`${platformStats.floorPriceStx.toFixed(2)} STX`}
              />
            </motion.div>
          </div>

          {/* Featured NFT carousel (simplified) */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
            className="relative"
          >
            <div className="glass rounded-2xl border border-neon-cyan/20 p-4 shadow-[0_0_40px_rgba(0,245,255,0.25)]">
              <div className="mb-3 flex items-center justify-between text-[11px] text-text-secondary">
                <span className="inline-flex items-center gap-1">
                  <Sparkles size={14} className="text-neon-pink" />
                  Öne Çıkan AI NFT
                </span>
                <span className="rounded-full bg-black/40 px-2 py-0.5 font-mono text-[10px] text-neon-cyan">
                  DALL·E 3 • STX
                </span>
              </div>
              <div className="relative overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={trending[0].imageUrl}
                  alt={trending[0].name}
                  className="h-64 w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-bg-primary/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-text-muted">
                        Cyber Genesis
                      </p>
                      <p className="text-sm font-semibold text-text-primary">
                        {trending[0].name}
                      </p>
                    </div>
                    <div className="rounded-lg bg-black/60 px-3 py-2 text-right">
                      <p className="text-[10px] text-text-muted">Şu anki fiyat</p>
                      <p className="font-mono text-sm text-neon-orange">
                        {trending[0].priceStx.toFixed(2)} STX
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Trending NFTs */}
        <section className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-heading text-lg font-semibold text-text-primary">
              Trend NFT&apos;ler
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-text-muted">
              <button className="rounded-full bg-bg-card px-3 py-1 text-xs text-text-secondary">
                24s
              </button>
              <button className="rounded-full px-3 py-1 text-xs text-text-muted hover:bg-bg-card">
                7g
              </button>
              <button className="rounded-full px-3 py-1 text-xs text-text-muted hover:bg-bg-card">
                Tümü
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {trending.map((nft) => (
              <div key={nft.id} className="neon-card overflow-hidden">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={nft.imageUrl}
                    alt={nft.name}
                    className="h-44 w-full object-cover"
                  />
                  <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-neon-cyan">
                    {nft.aiModel === "dall-e-3" ? "DALL·E 3" : "Stable Diffusion"}
                  </div>
                  {nft.isAuction && nft.blocksRemaining && (
                    <div className="absolute right-2 top-2 rounded-full bg-bg-card/90 px-2 py-0.5 text-[10px] font-mono text-text-secondary">
                      ~{nft.blocksRemaining} blok
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-3.5">
                  <p className="truncate text-xs text-text-secondary">{nft.collection}</p>
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {nft.name}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-text-muted">Fiyat</span>
                      <span className="font-mono text-neon-orange">
                        {nft.priceStx.toFixed(2)} STX
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-text-muted">Nadirlik</span>
                      <span className="text-xs text-neon-purple">{nft.rarity}/100</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Collections + Bitcoin security */}
        <section className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-heading text-lg font-semibold text-text-primary">
                Öne Çıkan Koleksiyonlar
              </h2>
              <Link
                href="/collections"
                className="text-xs text-neon-cyan hover:underline"
              >
                Tüm koleksiyonları gör
              </Link>
            </div>
            <div className="space-y-3">
              {topCollections.map((col) => (
                <div
                  key={col.id}
                  className="neon-card flex items-center gap-3 overflow-hidden p-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={col.avatarUrl}
                    alt={col.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{col.name}</p>
                    <p className="text-[11px] text-text-muted">
                      Taban:{" "}
                      <span className="font-mono text-neon-orange">
                        {col.floorPriceStx.toFixed(2)} STX
                      </span>{" "}
                      • Hacim:{" "}
                      <span className="font-mono">
                        {formatStx(col.volumeStx * 1_000_000, 0)}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-[11px] ${
                        col.change24h >= 0 ? "text-neon-green" : "text-neon-red"
                      }`}
                    >
                      {formatPercentChange(col.change24h)}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {formatNumber(col.itemCount)} NFT
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold text-text-primary">
              Bitcoin ile Güvence Altında
            </h2>
            <div className="neon-card relative overflow-hidden p-4">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-neon-orange/20 blur-3xl" />
              <div className="relative flex flex-col gap-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-[11px] text-text-secondary">
                  <Bitcoin size={14} className="text-neon-orange" />
                  Stacks → Bitcoin PoX bağlantısı
                </div>
                <p className="text-xs text-text-secondary">
                  Her NFT mint ve trade işlemi, Stacks üzerinden Bitcoin&apos;in Proof of
                  Work güvenliğine anchor edilir. Clarity sözleşmeleri, post-condition
                  desteğiyle fonlarının tam olarak ne olacağını işlemden önce gösterir.
                </p>
                <div className="flex items-center gap-4 text-[11px] text-text-muted">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-neon-green" />
                    <span>Clarity ile denetlenebilir akıllı kontratlar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-neon-cyan" />
                    <span>Mikrobloklarla hızlı onay</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI spotlight + recent listed + creators (compact) */}
        <section className="grid gap-8 lg:grid-cols-3">
          {/* AI spotlight */}
          <div className="space-y-4 lg:col-span-1">
            <h2 className="font-heading text-lg font-semibold text-text-primary">
              AI Studio Nasıl Çalışır?
            </h2>
            <div className="space-y-3 text-xs text-text-secondary">
              <StepBadge index={1} title="Vizyonunu tanımla">
                Cyberpunk, soyut veya portre; prompt&apos;unu yaz ya da GPT ile
                zenginleştir.
              </StepBadge>
              <StepBadge index={2} title="AI görseli üretsin">
                DALL·E 3 veya Stable Diffusion ile tek tıkla yüksek çözünürlüklü
                görseller al.
              </StepBadge>
              <StepBadge index={3} title="Stacks üzerinde mint et ve listele">
                SIP-009 uyumlu NFT&apos;yi cüzdanına mint et, ardından STX ile pazarda
                listelenmesini sağla.
              </StepBadge>
            </div>
            <Link
              href="/create"
              className="mt-2 inline-flex items-center text-xs text-neon-cyan hover:underline"
            >
              Demo prompt dene
              <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>

          {/* Recently listed */}
          <div className="space-y-4 lg:col-span-1">
            <h2 className="font-heading text-lg font-semibold text-text-primary">
              Yeni Listelenenler
            </h2>
            <div className="space-y-3 text-xs">
              {recent.map((nft) => (
                <div
                  key={nft.id}
                  className="neon-card flex items-center gap-3 overflow-hidden p-2.5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={nft.imageUrl}
                    alt={nft.name}
                    className="h-12 w-12 rounded-md object-cover"
                  />
                  <div className="flex-1">
                    <p className="truncate text-xs font-medium text-text-primary">
                      {nft.name}
                    </p>
                    <p className="truncate text-[11px] text-text-muted">
                      {nft.creator.bnsName} • {nft.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs text-neon-orange">
                      {nft.priceStx.toFixed(2)} STX
                    </p>
                    {nft.isAuction && nft.currentBidStx && (
                      <p className="text-[10px] text-text-muted">
                        Son teklif {nft.currentBidStx.toFixed(2)} STX
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top creators */}
          <div className="space-y-4 lg:col-span-1">
            <h2 className="font-heading text-lg font-semibold text-text-primary">
              Öne Çıkan Yaratıcılar
            </h2>
            <div className="space-y-3 text-xs">
              {topCreators.map((creator) => (
                <div
                  key={creator.address}
                  className="neon-card flex items-center gap-3 overflow-hidden p-2.5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={creator.avatarUrl}
                    alt={creator.bnsName}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-text-primary">
                      {creator.bnsName}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      {formatNumber(creator.followers)} takipçi •{" "}
                      {creator.isVerified ? "Doğrulanmış" : "Yaratıcı"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-text-muted">Toplam satış</p>
                    <p className="font-mono text-xs text-neon-green">
                      {formatStx(creator.totalSalesStx * 1_000_000, 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-lg bg-bg-card/70 px-3 py-2 backdrop-blur">
      <span className="text-[10px] text-text-muted">{label}</span>
      <span className="mt-0.5 text-xs font-semibold text-text-primary">{value}</span>
    </div>
  );
}

function StepBadge({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
      <div className="flex gap-3 rounded-lg bg-bg-card/70 p-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-neon-cyan to-neon-purple text-[11px] font-semibold">
        {index}
      </div>
      <div className="space-y-0.5">
        <p className="text-xs font-semibold text-text-primary">{title}</p>
        <p className="text-[11px] text-text-secondary">{children}</p>
      </div>
    </div>
  );
}
