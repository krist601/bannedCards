export const sealedCategories = [
  {slug:'bundles',name:'Bundles',description:'Bundles and gift bundles',color:'#6541a5'},
  {slug:'precons',name:'Precons',description:'Ready-to-play decks',color:'#276d76'},
  {slug:'booster-boxes',name:'Booster boxes',description:'A full box to open or draft',color:'#9d5131'},
  {slug:'booster-packs',name:'Booster packs',description:'Play, Collector and more',color:'#365ba0'},
  {slug:'extras',name:'Extras',description:'Draft Night, Secret Lair and special releases',color:'#8b3b67'},
] as const;
export type SealedView = {category?:string;set?:string;collection?:string};
export const sealedCollections = {newest:'Newest', 'latest-releases':'Latest releases', 'almost-gone':'Almost gone', deals:'Deals'};
