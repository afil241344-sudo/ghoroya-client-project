import heroBowlImg from '../assets/images/shemai_hero_bowl_1793156337325.jpg';
import gheeCloseupImg from '../assets/images/shemai_ghee_closeup_1793175979653.jpg';
import packagingBoxImg from '../assets/images/shemai_packaging_box_1793156354481.jpg';
import gheeJarImg from '../assets/images/shemai_ghee_jar_1793175996687.jpg';
import preparedDishImg from '../assets/images/prepared_malai_shemai_1793156370328.jpg';

export interface DefaultSliderImage {
  src: string;
  title: string;
  altText: string;
  caption: string;
}

export const DEFAULT_SLIDER_IMAGES: DefaultSliderImage[] = [
  {
    src: heroBowlImg,
    title: 'Shahi Lachcha Shemai',
    altText: 'খাঁটি গাওয়া ঘিয়ে ভাজা শাহী লাচ্ছা সেমাই বোল',
    caption: 'খাঁটি গাওয়া ঘিয়ে ভাজা শাহী লাচ্ছা সেমাই',
  },
  {
    src: gheeCloseupImg,
    title: 'Golden Shemai Close-up',
    altText: 'মুচমুচে সোনালী মিহি সুতা ও পেস্তা বাদাম ক্লোজআপ',
    caption: 'মুচমুচে সোনালী মিহি সুতা ও কাজু-পেস্তা বাদাম',
  },
  {
    src: packagingBoxImg,
    title: 'Premium Packaging',
    altText: 'প্রিমিয়াম ফুড-গ্রেড এক্সক্লুসিভ বক্স প্যাকেজিং',
    caption: 'প্রিমিয়াম ফুড-গ্রেড এয়ারটাইট বক্স প্যাকেজিং',
  },
  {
    src: gheeJarImg,
    title: 'Pure Ghee',
    altText: 'সিরাজগঞ্জের খাঁটি গরুর গাওয়া ঘি ও এলাচ উপাদান',
    caption: 'সিরাজগঞ্জের খাঁটি দেশি গরুর দুধের গাওয়া ঘি',
  },
  {
    src: preparedDishImg,
    title: 'Prepared Shahi Dessert',
    altText: 'ঘন দুধ-মালাই দিয়ে তৈরি সুস্বাদু শাহী সেমাই',
    caption: 'ঘন দুধ-মালাই ও পেস্তা বাদামে তৈরি শাহী ডেজার্ট',
  },
];
