import { ShemaiBundle } from '../types';

import heroBowlImg from '../assets/images/shemai_hero_bowl_1793156337325.jpg';
import gheeCloseupImg from '../assets/images/shemai_ghee_closeup_1793175979653.jpg';
import packagingBoxImg from '../assets/images/shemai_packaging_box_1793156354481.jpg';
import gheeJarImg from '../assets/images/shemai_ghee_jar_1793175996687.jpg';
import preparedDishImg from '../assets/images/prepared_malai_shemai_1793156370328.jpg';

const BUNDLE_IMAGE_MAP: Record<string, string> = {
  'bundle-single': packagingBoxImg,
  'bundle-double': heroBowlImg,
  'bundle-family': preparedDishImg,
  'prod-shemai-450': heroBowlImg,
  'prod-ghee-250': gheeJarImg,
  'prod-topping-nuts': gheeCloseupImg,
  'prod-kismis-gold': preparedDishImg,
  'prod-shemai-shahi-box': packagingBoxImg,
};

export function getBundleImage(bundle: Pick<ShemaiBundle, 'id' | 'imageUrl'>): string {
  return bundle.imageUrl || BUNDLE_IMAGE_MAP[bundle.id] || packagingBoxImg;
}
