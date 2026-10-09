import type {ProductKind} from '@/domain/commerce';
export type ShopSectionKey='custom'|'accessories';
/** Product sections managed from the CMS with the same Medusa category tree as sealed products. */
export const shopSections:Record<ShopSectionKey,{key:ShopSectionKey;path:string;root:string;kind:ProductKind;title:string;eyebrow:string;description:string;homeTitle:string}>={
 custom:{key:'custom',path:'/custom',root:'custom-products',kind:'custom',title:'Custom products',eyebrow:'Made by us',description:'Token packs, custom decks and other products designed by our team.',homeTitle:'Custom products'},
 accessories:{key:'accessories',path:'/accessories',root:'accessories',kind:'accessory',title:'Accessories',eyebrow:'Play in style',description:'Sleeves, dice, playmats and everything else for your games.',homeTitle:'Accessories'},
};
export const isShopSection=(value:unknown):value is ShopSectionKey=>value==='custom'||value==='accessories';
