import { Lead } from '../types';

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

// Comprehensive nationwide US metropolitan hubs across all 50 states, capitals, and economic regions
export const CITY_COORDINATES: Record<string, GeoCoordinates> = {
  // Alabama
  'Birmingham, AL': { lat: 33.5186, lng: -86.8104 },
  'Montgomery, AL': { lat: 32.3792, lng: -86.3077 },
  'Huntsville, AL': { lat: 34.7304, lng: -86.5861 },
  'Mobile, AL': { lat: 30.6954, lng: -88.0399 },
  'Tuscaloosa, AL': { lat: 33.2098, lng: -87.5692 },

  // Alaska
  'Anchorage, AK': { lat: 61.2181, lng: -149.9003 },
  'Fairbanks, AK': { lat: 64.8378, lng: -147.7164 },
  'Juneau, AK': { lat: 58.3019, lng: -134.4197 },

  // Arizona
  'Phoenix, AZ': { lat: 33.4484, lng: -112.0740 },
  'Tucson, AZ': { lat: 32.2226, lng: -110.9747 },
  'Mesa, AZ': { lat: 33.4152, lng: -111.8315 },
  'Chandler, AZ': { lat: 33.3062, lng: -111.8413 },
  'Scottsdale, AZ': { lat: 33.4942, lng: -111.9261 },
  'Glendale, AZ': { lat: 33.5387, lng: -112.1860 },
  'Tempe, AZ': { lat: 33.4255, lng: -111.9400 },
  'Flagstaff, AZ': { lat: 35.1983, lng: -111.6513 },

  // Arkansas
  'Little Rock, AR': { lat: 34.7465, lng: -92.2896 },
  'Fayetteville, AR': { lat: 36.0822, lng: -94.1719 },
  'Fort Smith, AR': { lat: 35.3859, lng: -94.3985 },
  'Springdale, AR': { lat: 36.1867, lng: -94.1288 },
  'Jonesboro, AR': { lat: 35.8423, lng: -90.7043 },

  // California
  'Los Angeles, CA': { lat: 34.0522, lng: -118.2437 },
  'San Francisco, CA': { lat: 37.7749, lng: -122.4194 },
  'San Diego, CA': { lat: 32.7157, lng: -117.1611 },
  'San Jose, CA': { lat: 37.3382, lng: -121.8863 },
  'Sacramento, CA': { lat: 38.5816, lng: -121.4944 },
  'Fresno, CA': { lat: 36.7468, lng: -119.7726 },
  'Long Beach, CA': { lat: 33.7701, lng: -118.1937 },
  'Oakland, CA': { lat: 37.8044, lng: -122.2712 },
  'Bakersfield, CA': { lat: 35.3733, lng: -119.0187 },
  'Anaheim, CA': { lat: 33.8366, lng: -117.9143 },
  'Stockton, CA': { lat: 37.9577, lng: -121.2908 },
  'Riverside, CA': { lat: 33.9806, lng: -117.3755 },
  'Irvine, CA': { lat: 33.6846, lng: -117.8265 },
  'Santa Ana, CA': { lat: 33.7455, lng: -117.8677 },
  'Modesto, CA': { lat: 37.6391, lng: -120.9969 },
  'Roseville, CA': { lat: 38.7525, lng: -121.2880 },
  'Redding, CA': { lat: 40.5865, lng: -122.3917 },
  'Santa Barbara, CA': { lat: 34.4208, lng: -119.6982 },

  // Colorado
  'Denver, CO': { lat: 39.7392, lng: -104.9903 },
  'Colorado Springs, CO': { lat: 38.8339, lng: -104.8214 },
  'Aurora, CO': { lat: 39.7294, lng: -104.8319 },
  'Fort Collins, CO': { lat: 40.5853, lng: -105.0844 },
  'Boulder, CO': { lat: 40.0150, lng: -105.2705 },
  'Pueblo, CO': { lat: 38.2544, lng: -104.6091 },

  // Connecticut
  'Bridgeport, CT': { lat: 41.1792, lng: -73.1894 },
  'New Haven, CT': { lat: 41.3083, lng: -72.9279 },
  'Stamford, CT': { lat: 41.0534, lng: -73.5387 },
  'Hartford, CT': { lat: 41.7658, lng: -72.6734 },
  'Waterbury, CT': { lat: 41.5582, lng: -73.0515 },

  // Delaware
  'Wilmington, DE': { lat: 39.7447, lng: -75.5484 },
  'Dover, DE': { lat: 39.1582, lng: -75.5244 },
  'Newark, DE': { lat: 39.6837, lng: -75.7497 },

  // District of Columbia
  'Washington, DC': { lat: 38.9072, lng: -77.0369 },

  // Florida
  'Miami, FL': { lat: 25.7617, lng: -80.1918 },
  'Tampa, FL': { lat: 27.9506, lng: -82.4572 },
  'Orlando, FL': { lat: 28.5383, lng: -81.3792 },
  'Jacksonville, FL': { lat: 30.3322, lng: -81.6557 },
  'St. Petersburg, FL': { lat: 27.7676, lng: -82.6403 },
  'Clearwater, FL': { lat: 27.9659, lng: -82.8001 },
  'Fort Lauderdale, FL': { lat: 26.1224, lng: -80.1373 },
  'West Palm Beach, FL': { lat: 26.7153, lng: -80.0534 },
  'Tallahassee, FL': { lat: 30.4383, lng: -84.2807 },
  'Cape Coral, FL': { lat: 26.5629, lng: -81.9495 },
  'Sarasota, FL': { lat: 27.3364, lng: -82.5307 },
  'Pensacola, FL': { lat: 30.4213, lng: -87.2169 },
  'Gainesville, FL': { lat: 29.6516, lng: -82.3248 },
  'Fort Myers, FL': { lat: 26.6406, lng: -81.8723 },

  // Georgia
  'Atlanta, GA': { lat: 33.7490, lng: -84.3880 },
  'Augusta, GA': { lat: 33.4735, lng: -82.0105 },
  'Columbus, GA': { lat: 32.4610, lng: -84.9877 },
  'Macon, GA': { lat: 32.8407, lng: -83.6324 },
  'Savannah, GA': { lat: 32.0809, lng: -81.0912 },
  'Athens, GA': { lat: 33.9519, lng: -83.3576 },

  // Hawaii
  'Honolulu, HI': { lat: 21.3069, lng: -157.8583 },
  'Hilo, HI': { lat: 19.7297, lng: -155.0900 },

  // Idaho
  'Boise, ID': { lat: 43.6150, lng: -116.2023 },
  'Meridian, ID': { lat: 43.6121, lng: -116.3915 },
  'Nampa, ID': { lat: 43.5407, lng: -116.5635 },
  'Idaho Falls, ID': { lat: 43.4927, lng: -112.0401 },

  // Illinois
  'Chicago, IL': { lat: 41.8781, lng: -87.6298 },
  'Aurora, IL': { lat: 41.7606, lng: -88.3201 },
  'Naperville, IL': { lat: 41.7508, lng: -88.1535 },
  'Joliet, IL': { lat: 41.5250, lng: -88.0817 },
  'Rockford, IL': { lat: 42.2711, lng: -89.0940 },
  'Springfield, IL': { lat: 39.7817, lng: -89.6501 },
  'Peoria, IL': { lat: 40.6936, lng: -89.5890 },

  // Indiana
  'Indianapolis, IN': { lat: 39.7684, lng: -86.1581 },
  'Fort Wayne, IN': { lat: 41.0793, lng: -85.1394 },
  'Evansville, IN': { lat: 37.9716, lng: -87.5711 },
  'South Bend, IN': { lat: 41.6764, lng: -86.2520 },
  'Bloomington, IN': { lat: 39.1653, lng: -86.5264 },

  // Iowa
  'Des Moines, IA': { lat: 41.5868, lng: -93.6250 },
  'Cedar Rapids, IA': { lat: 41.9779, lng: -91.6656 },
  'Davenport, IA': { lat: 41.5236, lng: -90.5776 },
  'Sioux City, IA': { lat: 42.4999, lng: -96.4003 },

  // Kansas
  'Wichita, KS': { lat: 37.6872, lng: -97.3301 },
  'Overland Park, KS': { lat: 38.9822, lng: -94.6708 },
  'Kansas City, KS': { lat: 39.1155, lng: -94.6268 },
  'Topeka, KS': { lat: 39.0558, lng: -95.6890 },

  // Kentucky
  'Louisville, KY': { lat: 38.2527, lng: -85.7585 },
  'Lexington, KY': { lat: 38.0406, lng: -84.5037 },
  'Bowling Green, KY': { lat: 36.9685, lng: -86.4808 },
  'Frankfort, KY': { lat: 38.2009, lng: -84.8733 },

  // Louisiana
  'New Orleans, LA': { lat: 29.9511, lng: -90.0715 },
  'Baton Rouge, LA': { lat: 30.4515, lng: -91.1871 },
  'Shreveport, LA': { lat: 32.5252, lng: -93.7502 },
  'Lafayette, LA': { lat: 30.2241, lng: -92.0198 },

  // Maine
  'Portland, ME': { lat: 43.6591, lng: -70.2568 },
  'Bangor, ME': { lat: 44.8016, lng: -68.7712 },
  'Augusta, ME': { lat: 44.3106, lng: -69.7795 },

  // Maryland
  'Baltimore, MD': { lat: 39.2904, lng: -76.6122 },
  'Frederick, MD': { lat: 39.4143, lng: -77.4105 },
  'Rockville, MD': { lat: 39.0840, lng: -77.1528 },
  'Annapolis, MD': { lat: 38.9784, lng: -76.4922 },

  // Massachusetts
  'Boston, MA': { lat: 42.3601, lng: -71.0589 },
  'Worcester, MA': { lat: 42.2626, lng: -71.8023 },
  'Springfield, MA': { lat: 42.1015, lng: -72.5898 },
  'Cambridge, MA': { lat: 42.3736, lng: -71.1097 },

  // Michigan
  'Detroit, MI': { lat: 42.3314, lng: -83.0458 },
  'Grand Rapids, MI': { lat: 42.9634, lng: -85.6681 },
  'Warren, MI': { lat: 42.5145, lng: -83.0147 },
  'Ann Arbor, MI': { lat: 42.2808, lng: -83.7430 },
  'Lansing, MI': { lat: 42.7325, lng: -84.5555 },

  // Minnesota
  'Minneapolis, MN': { lat: 44.9778, lng: -93.2650 },
  'St. Paul, MN': { lat: 44.9537, lng: -93.0900 },
  'Rochester, MN': { lat: 44.0121, lng: -92.4802 },
  'Duluth, MN': { lat: 46.7867, lng: -92.1005 },

  // Mississippi
  'Jackson, MS': { lat: 32.2988, lng: -90.1848 },
  'Gulfport, MS': { lat: 30.3674, lng: -89.0928 },
  'Southaven, MS': { lat: 34.9919, lng: -90.0026 },

  // Missouri
  'Kansas City, MO': { lat: 39.0997, lng: -94.5786 },
  'St. Louis, MO': { lat: 38.6270, lng: -90.1994 },
  'Springfield, MO': { lat: 37.2090, lng: -93.2923 },
  'Columbia, MO': { lat: 38.9517, lng: -92.3341 },

  // Montana
  'Billings, MT': { lat: 45.7833, lng: -108.5007 },
  'Missoula, MT': { lat: 46.8721, lng: -113.9940 },
  'Bozeman, MT': { lat: 45.6770, lng: -111.0429 },
  'Helena, MT': { lat: 46.5891, lng: -112.0391 },

  // Nebraska
  'Omaha, NE': { lat: 41.2565, lng: -95.9345 },
  'Lincoln, NE': { lat: 40.8136, lng: -96.7026 },

  // Nevada
  'Las Vegas, NV': { lat: 36.1699, lng: -115.1398 },
  'Henderson, NV': { lat: 36.0395, lng: -114.9817 },
  'Reno, NV': { lat: 39.5296, lng: -119.8138 },
  'Carson City, NV': { lat: 39.1638, lng: -119.7674 },

  // New Hampshire
  'Manchester, NH': { lat: 42.9956, lng: -71.4548 },
  'Nashua, NH': { lat: 42.7654, lng: -71.4676 },
  'Concord, NH': { lat: 43.2081, lng: -71.5376 },

  // New Jersey
  'Newark, NJ': { lat: 40.7357, lng: -74.1724 },
  'Jersey City, NJ': { lat: 40.7178, lng: -74.0431 },
  'Paterson, NJ': { lat: 40.9168, lng: -74.1718 },
  'Trenton, NJ': { lat: 40.2171, lng: -74.7429 },

  // New Mexico
  'Albuquerque, NM': { lat: 35.0844, lng: -106.6504 },
  'Las Cruces, NM': { lat: 32.3199, lng: -106.7637 },
  'Santa Fe, NM': { lat: 35.6870, lng: -105.9378 },

  // New York
  'New York, NY': { lat: 40.7128, lng: -74.0060 },
  'Buffalo, NY': { lat: 42.8864, lng: -78.8784 },
  'Rochester, NY': { lat: 43.1566, lng: -77.6088 },
  'Syracuse, NY': { lat: 43.0481, lng: -76.1474 },
  'Albany, NY': { lat: 42.6526, lng: -73.7562 },

  // North Carolina
  'Charlotte, NC': { lat: 35.2271, lng: -80.8431 },
  'Raleigh, NC': { lat: 35.7796, lng: -78.6382 },
  'Greensboro, NC': { lat: 36.0726, lng: -79.7920 },
  'Durham, NC': { lat: 35.9940, lng: -78.8986 },
  'Winston-Salem, NC': { lat: 36.0999, lng: -80.2442 },
  'Fayetteville, NC': { lat: 35.0526, lng: -78.8784 },
  'Wilmington, NC': { lat: 34.2104, lng: -77.8868 },
  'Asheville, NC': { lat: 35.5951, lng: -82.5515 },

  // North Dakota
  'Fargo, ND': { lat: 46.8772, lng: -96.7898 },
  'Bismarck, ND': { lat: 46.8083, lng: -100.7837 },
  'Grand Forks, ND': { lat: 47.9253, lng: -97.0329 },

  // Ohio
  'Columbus, OH': { lat: 39.9612, lng: -82.9988 },
  'Cleveland, OH': { lat: 41.4993, lng: -81.6944 },
  'Cincinnati, OH': { lat: 39.1031, lng: -84.5120 },
  'Toledo, OH': { lat: 41.6528, lng: -83.5379 },
  'Akron, OH': { lat: 41.0814, lng: -81.5190 },
  'Dayton, OH': { lat: 39.7589, lng: -84.1916 },

  // Oklahoma
  'Oklahoma City, OK': { lat: 35.4676, lng: -97.5164 },
  'Tulsa, OK': { lat: 36.1540, lng: -95.9928 },
  'Norman, OK': { lat: 35.2226, lng: -97.4395 },

  // Oregon
  'Portland, OR': { lat: 45.5152, lng: -122.6784 },
  'Salem, OR': { lat: 44.9429, lng: -123.0351 },
  'Eugene, OR': { lat: 44.0521, lng: -123.0868 },
  'Bend, OR': { lat: 44.0582, lng: -121.3153 },

  // Pennsylvania
  'Philadelphia, PA': { lat: 39.9526, lng: -75.1652 },
  'Pittsburgh, PA': { lat: 40.4406, lng: -79.9959 },
  'Allentown, PA': { lat: 40.6084, lng: -75.4902 },
  'Erie, PA': { lat: 42.1292, lng: -80.0851 },
  'Harrisburg, PA': { lat: 40.2732, lng: -76.8867 },

  // Rhode Island
  'Providence, RI': { lat: 41.8240, lng: -71.4128 },
  'Warwick, RI': { lat: 41.7001, lng: -71.4162 },

  // South Carolina
  'Charleston, SC': { lat: 32.7765, lng: -79.9311 },
  'Columbia, SC': { lat: 34.0007, lng: -81.0348 },
  'Greenville, SC': { lat: 34.8526, lng: -82.3940 },
  'Myrtle Beach, SC': { lat: 33.6891, lng: -78.8867 },

  // South Dakota
  'Sioux Falls, SD': { lat: 43.5460, lng: -96.7313 },
  'Rapid City, SD': { lat: 44.0805, lng: -103.2310 },
  'Pierre, SD': { lat: 44.3683, lng: -100.3510 },

  // Tennessee
  'Nashville, TN': { lat: 36.1627, lng: -86.7816 },
  'Memphis, TN': { lat: 35.1495, lng: -90.0490 },
  'Knoxville, TN': { lat: 35.9606, lng: -83.9207 },
  'Chattanooga, TN': { lat: 35.0456, lng: -85.3097 },

  // Texas
  'Houston, TX': { lat: 29.7604, lng: -95.3698 },
  'San Antonio, TX': { lat: 29.4241, lng: -98.4936 },
  'Dallas, TX': { lat: 32.7767, lng: -96.7970 },
  'Austin, TX': { lat: 30.2672, lng: -97.7431 },
  'Fort Worth, TX': { lat: 32.7555, lng: -97.3308 },
  'El Paso, TX': { lat: 31.7619, lng: -106.4850 },
  'Arlington, TX': { lat: 32.7357, lng: -97.1081 },
  'Plano, TX': { lat: 33.0198, lng: -96.6989 },
  'Lubbock, TX': { lat: 33.5779, lng: -101.8552 },
  'Corpus Christi, TX': { lat: 27.8006, lng: -97.3964 },
  'Amarillo, TX': { lat: 35.2220, lng: -101.8313 },
  'Waco, TX': { lat: 31.5493, lng: -97.1467 },

  // Utah
  'Salt Lake City, UT': { lat: 40.7608, lng: -111.8910 },
  'Provo, UT': { lat: 40.2338, lng: -111.6585 },
  'Ogden, UT': { lat: 41.2230, lng: -111.9738 },
  'St. George, UT': { lat: 37.0965, lng: -113.5684 },

  // Vermont
  'Burlington, VT': { lat: 44.4759, lng: -73.2121 },
  'Montpelier, VT': { lat: 44.2601, lng: -72.5754 },

  // Virginia
  'Virginia Beach, VA': { lat: 36.8529, lng: -75.9780 },
  'Norfolk, VA': { lat: 36.8508, lng: -76.2859 },
  'Richmond, VA': { lat: 37.5407, lng: -77.4360 },
  'Alexandria, VA': { lat: 38.8048, lng: -77.0469 },
  'Roanoke, VA': { lat: 37.2710, lng: -79.9414 },

  // Washington
  'Seattle, WA': { lat: 47.6062, lng: -122.3321 },
  'Spokane, WA': { lat: 47.6588, lng: -117.4260 },
  'Tacoma, WA': { lat: 47.2529, lng: -122.4443 },
  'Vancouver, WA': { lat: 45.6387, lng: -122.6615 },
  'Bellevue, WA': { lat: 47.6101, lng: -122.2015 },
  'Olympia, WA': { lat: 47.0379, lng: -122.9007 },

  // West Virginia
  'Charleston, WV': { lat: 38.3498, lng: -81.6326 },
  'Morgantown, WV': { lat: 39.6295, lng: -79.9559 },

  // Wisconsin
  'Milwaukee, WI': { lat: 43.0389, lng: -87.9065 },
  'Madison, WI': { lat: 43.0731, lng: -89.4012 },
  'Green Bay, WI': { lat: 44.5192, lng: -88.0198 },

  // Wyoming
  'Cheyenne, WY': { lat: 41.1400, lng: -104.8202 },
  'Casper, WY': { lat: 42.8501, lng: -106.3252 },
  'Jackson, WY': { lat: 43.4799, lng: -110.7624 },

  // Puerto Rico
  'San Juan, PR': { lat: 18.4655, lng: -66.1057 },
  'Ponce, PR': { lat: 18.0111, lng: -66.6141 }
};

// All 50 US State centroids + DC + Puerto Rico
export const US_STATE_CENTROIDS: Record<string, { lat: number; lng: number; name: string }> = {
  AL: { lat: 32.806671, lng: -86.79113, name: 'Alabama' },
  AK: { lat: 61.370716, lng: -152.404419, name: 'Alaska' },
  AZ: { lat: 33.729759, lng: -111.431221, name: 'Arizona' },
  AR: { lat: 34.969704, lng: -92.373123, name: 'Arkansas' },
  CA: { lat: 36.116203, lng: -119.681564, name: 'California' },
  CO: { lat: 39.059811, lng: -105.311104, name: 'Colorado' },
  CT: { lat: 41.597782, lng: -72.755371, name: 'Connecticut' },
  DE: { lat: 39.318523, lng: -75.507141, name: 'Delaware' },
  DC: { lat: 38.907192, lng: -77.036871, name: 'District of Columbia' },
  FL: { lat: 27.766279, lng: -81.686783, name: 'Florida' },
  GA: { lat: 33.040619, lng: -83.643074, name: 'Georgia' },
  HI: { lat: 21.094318, lng: -157.498337, name: 'Hawaii' },
  ID: { lat: 44.240459, lng: -114.478828, name: 'Idaho' },
  IL: { lat: 40.349457, lng: -88.986137, name: 'Illinois' },
  IN: { lat: 39.849426, lng: -86.258278, name: 'Indiana' },
  IA: { lat: 42.011539, lng: -93.210526, name: 'Iowa' },
  KS: { lat: 38.5266, lng: -96.726486, name: 'Kansas' },
  KY: { lat: 37.66814, lng: -84.670067, name: 'Kentucky' },
  LA: { lat: 31.169546, lng: -91.867805, name: 'Louisiana' },
  ME: { lat: 44.693947, lng: -69.381927, name: 'Maine' },
  MD: { lat: 39.063946, lng: -76.802101, name: 'Maryland' },
  MA: { lat: 42.230171, lng: -71.530106, name: 'Massachusetts' },
  MI: { lat: 43.326618, lng: -84.536095, name: 'Michigan' },
  MN: { lat: 45.694454, lng: -93.900192, name: 'Minnesota' },
  MS: { lat: 32.741646, lng: -89.678696, name: 'Mississippi' },
  MO: { lat: 38.456085, lng: -92.288368, name: 'Missouri' },
  MT: { lat: 46.921925, lng: -110.454353, name: 'Montana' },
  NE: { lat: 41.12537, lng: -98.268082, name: 'Nebraska' },
  NV: { lat: 38.313515, lng: -117.055374, name: 'Nevada' },
  NH: { lat: 43.452492, lng: -71.563896, name: 'New Hampshire' },
  NJ: { lat: 40.298904, lng: -74.521011, name: 'New Jersey' },
  NM: { lat: 34.840515, lng: -106.248482, name: 'New Mexico' },
  NY: { lat: 42.165726, lng: -74.948051, name: 'New York' },
  NC: { lat: 35.630066, lng: -79.806419, name: 'North Carolina' },
  ND: { lat: 47.528912, lng: -99.784012, name: 'North Dakota' },
  OH: { lat: 40.388783, lng: -82.764915, name: 'Ohio' },
  OK: { lat: 35.565342, lng: -96.928917, name: 'Oklahoma' },
  OR: { lat: 44.572021, lng: -122.070938, name: 'Oregon' },
  PA: { lat: 40.590752, lng: -77.209755, name: 'Pennsylvania' },
  RI: { lat: 41.680893, lng: -71.51178, name: 'Rhode Island' },
  SC: { lat: 33.856892, lng: -80.945007, name: 'South Carolina' },
  SD: { lat: 44.299782, lng: -99.438828, name: 'South Dakota' },
  TN: { lat: 35.747845, lng: -86.692345, name: 'Tennessee' },
  TX: { lat: 31.054487, lng: -97.563461, name: 'Texas' },
  UT: { lat: 40.150032, lng: -111.862434, name: 'Utah' },
  VT: { lat: 44.045876, lng: -72.710686, name: 'Vermont' },
  VA: { lat: 37.769337, lng: -78.169968, name: 'Virginia' },
  WA: { lat: 47.400902, lng: -121.490494, name: 'Washington' },
  WV: { lat: 38.491226, lng: -80.954453, name: 'West Virginia' },
  WI: { lat: 44.268543, lng: -89.616508, name: 'Wisconsin' },
  WY: { lat: 42.755966, lng: -107.30249, name: 'Wyoming' },
  PR: { lat: 18.220833, lng: -66.590149, name: 'Puerto Rico' }
};

// 2-Digit US Postal ZIP Code prefix geolocation dictionary
export const US_ZIP_PREFIX_COORDINATES: Record<string, GeoCoordinates> = {
  '00': { lat: 18.22, lng: -66.59 }, // PR
  '01': { lat: 42.36, lng: -71.95 }, // MA
  '02': { lat: 42.15, lng: -71.05 }, // MA / RI
  '03': { lat: 43.45, lng: -71.56 }, // NH
  '04': { lat: 44.69, lng: -69.38 }, // ME
  '05': { lat: 44.04, lng: -72.71 }, // VT
  '06': { lat: 41.59, lng: -72.75 }, // CT
  '07': { lat: 40.75, lng: -74.20 }, // NJ
  '08': { lat: 39.85, lng: -74.75 }, // NJ
  '09': { lat: 40.71, lng: -74.00 }, // AE (Mil)
  '10': { lat: 40.78, lng: -73.96 }, // NY (NYC)
  '11': { lat: 40.72, lng: -73.80 }, // NY (Queens/Brooklyn)
  '12': { lat: 42.65, lng: -73.75 }, // NY (Albany)
  '13': { lat: 43.05, lng: -76.15 }, // NY (Syracuse)
  '14': { lat: 42.89, lng: -78.87 }, // NY (Buffalo)
  '15': { lat: 40.44, lng: -79.99 }, // PA (Pittsburgh)
  '16': { lat: 41.50, lng: -79.00 }, // PA
  '17': { lat: 40.27, lng: -76.88 }, // PA (Harrisburg)
  '18': { lat: 41.00, lng: -75.50 }, // PA
  '19': { lat: 39.95, lng: -75.16 }, // PA (Philly) / DE
  '20': { lat: 38.90, lng: -77.03 }, // DC
  '21': { lat: 39.29, lng: -76.61 }, // MD (Baltimore)
  '22': { lat: 38.80, lng: -77.10 }, // VA (NoVA)
  '23': { lat: 37.54, lng: -77.43 }, // VA (Richmond)
  '24': { lat: 37.27, lng: -80.00 }, // VA
  '25': { lat: 38.35, lng: -81.63 }, // WV (Charleston)
  '26': { lat: 39.30, lng: -80.30 }, // WV
  '27': { lat: 35.78, lng: -78.64 }, // NC (Raleigh)
  '28': { lat: 35.22, lng: -80.84 }, // NC (Charlotte)
  '29': { lat: 34.00, lng: -81.03 }, // SC (Columbia)
  '30': { lat: 33.75, lng: -84.39 }, // GA (Atlanta)
  '31': { lat: 32.08, lng: -81.09 }, // GA (Savannah)
  '32': { lat: 30.33, lng: -81.65 }, // FL (Jacksonville)
  '33': { lat: 25.76, lng: -80.19 }, // FL (Miami / South FL)
  '34': { lat: 27.95, lng: -82.45 }, // FL (Tampa / Central FL)
  // 3-digit regional overrides for high accuracy
  '335': { lat: 27.90, lng: -82.30 }, // FL (Brandon / Hillsborough)
  '336': { lat: 27.95, lng: -82.45 }, // FL (Tampa)
  '337': { lat: 27.77, lng: -82.64 }, // FL (St. Petersburg / Pinellas)
  '338': { lat: 28.04, lng: -81.95 }, // FL (Lakeland / Polk)
  '339': { lat: 26.64, lng: -81.87 }, // FL (Fort Myers / Cape Coral)
  '328': { lat: 28.53, lng: -81.37 }, // FL (Orlando)
  '900': { lat: 34.05, lng: -118.24 }, // CA (Los Angeles)
  '902': { lat: 34.07, lng: -118.40 }, // CA (Beverly Hills)
  '921': { lat: 32.72, lng: -117.16 }, // CA (San Diego)
  '941': { lat: 37.77, lng: -122.42 }, // CA (San Francisco)
  '951': { lat: 37.33, lng: -121.89 }, // CA (San Jose)
  '787': { lat: 30.26, lng: -97.74 }, // TX (Austin)
  '752': { lat: 32.78, lng: -96.80 }, // TX (Dallas)
  '770': { lat: 29.76, lng: -95.37 }, // TX (Houston)
  '606': { lat: 41.88, lng: -87.63 }, // IL (Chicago)
  '981': { lat: 47.61, lng: -122.33 }, // WA (Seattle)
  '100': { lat: 40.71, lng: -74.00 }, // NY (New York City)
  '021': { lat: 42.36, lng: -71.06 }, // MA (Boston)
  '303': { lat: 33.75, lng: -84.39 }, // GA (Atlanta)
  '802': { lat: 39.74, lng: -104.99 }, // CO (Denver)
  '850': { lat: 33.45, lng: -112.07 }, // AZ (Phoenix)
  '35': { lat: 33.52, lng: -86.81 }, // AL (Birmingham)
  '36': { lat: 32.38, lng: -86.30 }, // AL (Montgomery/Mobile)
  '37': { lat: 36.16, lng: -86.78 }, // TN (Nashville)
  '38': { lat: 35.15, lng: -90.05 }, // TN (Memphis)
  '39': { lat: 32.30, lng: -90.18 }, // MS (Jackson)
  '40': { lat: 38.25, lng: -85.75 }, // KY (Louisville)
  '41': { lat: 38.04, lng: -84.50 }, // KY (Lexington)
  '42': { lat: 37.00, lng: -86.50 }, // KY
  '43': { lat: 39.96, lng: -83.00 }, // OH (Columbus)
  '44': { lat: 41.50, lng: -81.69 }, // OH (Cleveland)
  '45': { lat: 39.10, lng: -84.51 }, // OH (Cincinnati)
  '46': { lat: 39.77, lng: -86.16 }, // IN (Indianapolis)
  '47': { lat: 38.50, lng: -87.00 }, // IN
  '48': { lat: 42.33, lng: -83.05 }, // MI (Detroit)
  '49': { lat: 42.96, lng: -85.67 }, // MI (Grand Rapids)
  '50': { lat: 41.59, lng: -93.63 }, // IA (Des Moines)
  '51': { lat: 42.00, lng: -94.00 }, // IA
  '52': { lat: 41.52, lng: -90.58 }, // IA (Davenport)
  '53': { lat: 43.04, lng: -87.91 }, // WI (Milwaukee)
  '54': { lat: 44.52, lng: -88.02 }, // WI (Green Bay)
  '55': { lat: 44.98, lng: -93.26 }, // MN (Minneapolis)
  '56': { lat: 46.00, lng: -94.50 }, // MN
  '57': { lat: 43.55, lng: -96.73 }, // SD (Sioux Falls)
  '58': { lat: 46.88, lng: -96.79 }, // ND (Fargo)
  '59': { lat: 45.78, lng: -108.50 }, // MT (Billings)
  '60': { lat: 41.88, lng: -87.63 }, // IL (Chicago)
  '61': { lat: 40.69, lng: -89.59 }, // IL (Peoria)
  '62': { lat: 39.78, lng: -89.65 }, // IL (Springfield)
  '63': { lat: 38.63, lng: -90.20 }, // MO (St. Louis)
  '64': { lat: 39.10, lng: -94.58 }, // MO (Kansas City)
  '65': { lat: 37.21, lng: -93.29 }, // MO (Springfield)
  '66': { lat: 39.00, lng: -95.00 }, // KS (Topeka/KC)
  '67': { lat: 37.69, lng: -97.33 }, // KS (Wichita)
  '68': { lat: 41.26, lng: -95.93 }, // NE (Omaha)
  '69': { lat: 41.50, lng: -100.00 }, // NE
  '70': { lat: 29.95, lng: -90.07 }, // LA (New Orleans)
  '71': { lat: 32.52, lng: -93.75 }, // LA (Shreveport)
  '72': { lat: 34.75, lng: -92.29 }, // AR (Little Rock)
  '73': { lat: 35.47, lng: -97.52 }, // OK (Oklahoma City)
  '74': { lat: 36.15, lng: -95.99 }, // OK (Tulsa)
  '75': { lat: 32.78, lng: -96.80 }, // TX (Dallas)
  '76': { lat: 32.75, lng: -97.33 }, // TX (Fort Worth)
  '77': { lat: 29.76, lng: -95.37 }, // TX (Houston)
  '78': { lat: 29.42, lng: -98.49 }, // TX (San Antonio/Austin)
  '79': { lat: 31.76, lng: -106.48 }, // TX (El Paso/West TX)
  '80': { lat: 39.74, lng: -104.99 }, // CO (Denver)
  '81': { lat: 38.83, lng: -104.82 }, // CO (Colorado Springs)
  '82': { lat: 41.14, lng: -104.82 }, // WY (Cheyenne)
  '83': { lat: 43.62, lng: -116.20 }, // ID (Boise)
  '84': { lat: 40.76, lng: -111.89 }, // UT (Salt Lake City)
  '85': { lat: 33.45, lng: -112.07 }, // AZ (Phoenix)
  '86': { lat: 34.50, lng: -111.00 }, // AZ
  '87': { lat: 35.08, lng: -106.65 }, // NM (Albuquerque)
  '88': { lat: 32.50, lng: -105.00 }, // NM
  '89': { lat: 36.17, lng: -115.14 }, // NV (Las Vegas/Reno)
  '90': { lat: 34.05, lng: -118.24 }, // CA (Los Angeles)
  '91': { lat: 34.18, lng: -118.31 }, // CA (Burbank/Glendale)
  '92': { lat: 32.72, lng: -117.16 }, // CA (San Diego/Orange Cty)
  '93': { lat: 35.37, lng: -119.02 }, // CA (Bakersfield/Fresno)
  '94': { lat: 37.77, lng: -122.42 }, // CA (San Francisco/Bay Area)
  '95': { lat: 38.58, lng: -121.49 }, // CA (Sacramento/Stockton)
  '96': { lat: 21.31, lng: -157.86 }, // HI (Honolulu)
  '97': { lat: 45.52, lng: -122.68 }, // OR (Portland)
  '98': { lat: 47.61, lng: -122.33 }, // WA (Seattle)
  '99': { lat: 47.66, lng: -117.43 }  // WA (Spokane) / AK (Anchorage)
};

export function calculateHaversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Universal, resilient nationwide US location resolver that parses:
 * 1. Direct city matches in CITY_COORDINATES across all 50 states
 * 2. 5-Digit US ZIP Codes via prefix geolocation table (e.g. 90210, 33602, 10001, 78701)
 * 3. Exact state abbreviations or full state names (e.g. "FL", "Texas", "California")
 * 4. Case-insensitive and normalized city & state combinations (e.g. "Bozeman MT", "Miami Beach FL")
 * 5. Deterministic state-bounded sub-regional geocoding
 */
export function resolveLocationCoordinates(locationStr: string): GeoCoordinates {
  if (!locationStr) {
    return { lat: 39.8283, lng: -98.5795 }; // US Geographic Center
  }

  const clean = locationStr.trim();
  const lower = clean.toLowerCase();
  const normalized = lower.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Exact match against known nationwide CITY_COORDINATES keys
  for (const [cityKey, coords] of Object.entries(CITY_COORDINATES)) {
    const keyLower = cityKey.toLowerCase();
    const keyNorm = keyLower.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (lower === keyLower || normalized === keyNorm) {
      return coords;
    }
  }

  // 2. Exact city name AND state match within string (e.g. "Tampa, FL 33602", "Sacramento, CA 95814")
  for (const [cityKey, coords] of Object.entries(CITY_COORDINATES)) {
    const cityNameOnly = cityKey.split(',')[0].trim().toLowerCase();
    const stateOnly = cityKey.split(',')[1]?.trim().toLowerCase() || '';
    if (lower.includes(cityNameOnly) && stateOnly && lower.includes(stateOnly)) {
      return coords;
    }
  }

  // 3. 5-digit US Postal ZIP code extraction (supports 3-digit and 2-digit regional prefixes)
  const zipMatch = clean.match(/\b(\d{5})\b/);
  if (zipMatch) {
    const zip = zipMatch[1];
    const prefix3 = zip.substring(0, 3);
    const prefix2 = zip.substring(0, 2);
    const baseZip = US_ZIP_PREFIX_COORDINATES[prefix3] || US_ZIP_PREFIX_COORDINATES[prefix2];
    if (baseZip) {
      const last2 = parseInt(zip.substring(3), 10) || 0;
      const latOffset = ((last2 % 50) - 25) / 200;
      const lngOffset = (((last2 * 3) % 50) - 25) / 200;
      return {
        lat: Number((baseZip.lat + latOffset).toFixed(4)),
        lng: Number((baseZip.lng + lngOffset).toFixed(4))
      };
    }
  }

  // 4. Direct city name match (e.g. "tampa" -> 'Tampa, FL', "denver" -> 'Denver, CO')
  for (const [cityKey, coords] of Object.entries(CITY_COORDINATES)) {
    const cityNameOnly = cityKey.split(',')[0].trim().toLowerCase();
    if (lower === cityNameOnly || normalized === cityNameOnly) {
      return coords;
    }
  }

  // 4. Substring match if input includes city name AND state
  for (const [cityKey, coords] of Object.entries(CITY_COORDINATES)) {
    const cityNameOnly = cityKey.split(',')[0].trim().toLowerCase();
    const stateOnly = cityKey.split(',')[1]?.trim().toLowerCase() || '';
    if (lower.includes(cityNameOnly) && (stateOnly ? lower.includes(stateOnly) : true)) {
      return coords;
    }
  }

  // 5. City name substring match
  for (const [cityKey, coords] of Object.entries(CITY_COORDINATES)) {
    const cityNameOnly = cityKey.split(',')[0].trim().toLowerCase();
    if (lower.includes(cityNameOnly)) {
      return coords;
    }
  }

  // 6. State code match (e.g. "FL", "TX", "CA", "MT", "WY")
  const stateCodeMatch = clean.match(/\b([A-Za-z]{2})\b/);
  if (stateCodeMatch) {
    const code = stateCodeMatch[1].toUpperCase();
    if (US_STATE_CENTROIDS[code]) {
      const state = US_STATE_CENTROIDS[code];
      const hash = clean.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);
      const latOffset = ((hash % 100) - 50) / 75;
      const lngOffset = (((hash * 7) % 100) - 50) / 75;
      return {
        lat: Number((state.lat + latOffset).toFixed(4)),
        lng: Number((state.lng + lngOffset).toFixed(4))
      };
    }
  }

  // 7. State full name extraction (e.g. "Texas", "Florida", "North Carolina")
  for (const [code, state] of Object.entries(US_STATE_CENTROIDS)) {
    if (lower.includes(state.name.toLowerCase())) {
      const hash = clean.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);
      const latOffset = ((hash % 100) - 50) / 75;
      const lngOffset = (((hash * 7) % 100) - 50) / 75;
      return {
        lat: Number((state.lat + latOffset).toFixed(4)),
        lng: Number((state.lng + lngOffset).toFixed(4))
      };
    }
  }

  // 8. Fallback deterministic placement within continental US
  const hash = clean.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);
  const lat = 32.0 + ((hash % 140) / 10);
  const lng = -118.0 + ((hash % 420) / 10);
  return {
    lat: Number(lat.toFixed(4)),
    lng: Number(lng.toFixed(4))
  };
}

export function getLeadCoordinates(lead: Lead): GeoCoordinates {
  const baseCoords = resolveLocationCoordinates(lead.location);
  if (!lead.name) return baseCoords;

  // Apply deterministic sub-metro dispersion so multiple businesses in the same city
  // (e.g. 10 businesses in Tampa, FL) are spread 1.5 to 8.5 miles across the metro area
  // instead of stacking on the identical pixel coordinate with '+0 mi from prev'
  const seed = (lead.name + (lead.id || '')).split('').reduce((acc, char, idx) => acc + char.charCodeAt(0) * (idx + 1), 0);
  const angle = (seed % 360) * (Math.PI / 180);
  const distanceMiles = 1.5 + ((seed % 70) / 10); // 1.5 to 8.5 miles
  const latOffset = (distanceMiles / 69.0) * Math.cos(angle);
  const lngOffset = (distanceMiles / (69.0 * Math.cos(Math.max(0.2, baseCoords.lat * (Math.PI / 180))))) * Math.sin(angle);

  return {
    lat: Number((baseCoords.lat + latOffset).toFixed(4)),
    lng: Number((baseCoords.lng + lngOffset).toFixed(4))
  };
}

/**
 * Extracts unique departure hubs from the actual active leads pool,
 * providing real-time, zero-configuration dropdown options based on ingested data.
 */
export function extractAvailableHubs(leads: Lead[]): Array<{ name: string; count: number }> {
  const hubCounts: Record<string, number> = {};

  leads.forEach(lead => {
    if (!lead.location) return;
    const clean = lead.location.trim();
    let matchedName = clean;
    for (const cityKey of Object.keys(CITY_COORDINATES)) {
      const cityName = cityKey.split(',')[0].toLowerCase();
      if (clean.toLowerCase().includes(cityName)) {
        matchedName = cityKey;
        break;
      }
    }
    hubCounts[matchedName] = (hubCounts[matchedName] || 0) + 1;
  });

  return Object.entries(hubCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Detects the dominant market hub from the active leads pool
 */
export function detectDominantCityHub(leads: Lead[]): string {
  const hubs = extractAvailableHubs(leads);
  if (hubs.length > 0) {
    return hubs[0].name;
  }
  return 'Dallas, TX';
}

export interface ScoutRouteStop {
  stopNumber: number;
  lead: Lead;
  distanceFromPreviousMiles: number;
  coordinates: GeoCoordinates;
}

export interface OptimizedRouteItinerary {
  stops: ScoutRouteStop[];
  totalDistanceMiles: number;
  estimatedDriveMinutes: number;
  googleMapsUrl: string;
}

export function filterLeadsByRadius(leads: Lead[], hubCity: string, radiusMiles: number): Lead[] {
  const hubCoords = resolveLocationCoordinates(hubCity);

  return leads.filter(lead => {
    const leadCoords = getLeadCoordinates(lead);
    const dist = calculateHaversineDistanceMiles(hubCoords.lat, hubCoords.lng, leadCoords.lat, leadCoords.lng);
    return dist <= radiusMiles;
  });
}

export function optimizeScoutDrivingRoute(targetLeads: Lead[], hubCity: string): OptimizedRouteItinerary {
  const hubCoords = resolveLocationCoordinates(hubCity);
  const unvisited = [...targetLeads];
  const stops: ScoutRouteStop[] = [];

  let currentLat = hubCoords.lat;
  let currentLng = hubCoords.lng;
  let totalDistanceMiles = 0;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const coords = getLeadCoordinates(unvisited[i]);
      const dist = calculateHaversineDistanceMiles(currentLat, currentLng, coords.lat, coords.lng);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIndex = i;
      }
    }

    const nextLead = unvisited.splice(nearestIndex, 1)[0];
    const nextCoords = getLeadCoordinates(nextLead);

    stops.push({
      stopNumber: stops.length + 1,
      lead: nextLead,
      distanceFromPreviousMiles: nearestDist,
      coordinates: nextCoords
    });

    totalDistanceMiles += nearestDist;
    currentLat = nextCoords.lat;
    currentLng = nextCoords.lng;
  }

  totalDistanceMiles = Number(totalDistanceMiles.toFixed(1));
  const estimatedDriveMinutes = Math.round(totalDistanceMiles * 1.6); // Avg 37.5 mph in local trade regions

  // Build multi-stop Google Maps URL
  const destinationQuery = stops.map(s => encodeURIComponent(`${s.lead.name}, ${s.lead.location}`)).join('/');
  const googleMapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(hubCity)}/${destinationQuery}`;

  return {
    stops,
    totalDistanceMiles,
    estimatedDriveMinutes,
    googleMapsUrl
  };
}

