"use client";

import dynamic from "next/dynamic";

const ExploreClient = dynamic(() => import("./ExploreClient"), { ssr: false });

export default function ExplorePage() {
  return <ExploreClient />;
}
