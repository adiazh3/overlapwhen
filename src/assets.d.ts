declare module "*.asset.json" {
  const asset: { url: string; asset_id: string; size: number };
  export default asset;
}
