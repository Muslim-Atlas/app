import React from 'react';
import { FlexWidget, TextWidget, SvgWidget } from 'react-native-android-widget';

// Inline vector SVG map pin icon identical to location-sharp from Ionicons
const locationPinSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#cbd5e1" width="10" height="10">
  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
</svg>
`;

// Inline vector SVG sun icon matching sunny-outline from Ionicons
const sunIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="#ffffff" width="10" height="10">
  <path d="M256 160c-52.9 0-96 43.1-96 96s43.1 96 96 96 96-43.1 96-96-43.1-96-96-96zm0 256c-88.4 0-160-71.6-160-160S167.6 96 256 96s160 71.6 160 160-71.6 160-160 160zm0-384c13.3 0 24-10.7 24-24V24c0-13.3-10.7-24-24-24s-24 10.7-24 24v8c0 13.3 10.7 24 24 24zm0 432c-13.3 0-24 10.7-24 24v8c0 13.3 10.7 24 24 24s24-10.7 24-24v-8c0-13.3-10.7-24-24-24zm181-309c9.4-9.4 9.4-24.6 0-33.9l-5.7-5.7c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l5.7 5.7c9.3 9.4 24.5 9.4 33.9 0zM114.9 397.1c-9.4-9.4-24.6-9.4-33.9 0l-5.7 5.7c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l5.7-5.7c9.4-9.3 9.4-24.5 0-33.9zm303 33.9c9.4 9.4 24.6 9.4 33.9 0l5.7-5.7c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-5.7 5.7c-9.4 9.3-9.4 24.5 0 33.9zM114.9 114.9c9.4 9.4 24.6 9.4 33.9 0l5.7-5.7c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-5.7 5.7c-9.4 9.3-9.4 24.5 0 33.9zM488 232h-8c-13.3 0-24 10.7-24 24s10.7 24 24 24h8c13.3 0 24-10.7 24-24s-10.7-24-24-24zM56 232H48c-13.3 0-24 10.7-24 24s10.7 24 24 24h8c13.3 0 24-10.7 24-24s-10.7-24-24-24z"/>
</svg>
`;

// Inline vector SVG refresh / sync icon
const refreshIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="#bae6fd" width="10" height="10">
  <path d="M464 16c-17.7 0-32 14.3-32 32v67.8C394.8 69.8 335.7 40 272 40 148.3 40 48 140.3 48 264s100.3 224 224 224c107.5 0 196.9-76.3 218.4-177.3 3.7-17.3-7.4-34.3-24.7-38s-34.3 7.4-38 24.7C411.3 379.6 345.8 432 272 432 179.2 432 104 356.8 104 264S179.2 96 272 96c52.4 0 99.4 24.5 130.4 63H352c-17.7 0-32 14.3-32 32s14.3 32 32 32h112c17.7 0 32-14.3 32-32V48c0-17.7-14.3-32-32-32z"/>
</svg>
`;

export function PrayerWidget({ prayerTimes, nextPrayerName, currentPrayerName, locationName = 'Current Location' }) {
  // Only the 5 daily prayers in the grid, matching the home screen card
  const prayers = [
    { name: 'Fajr', time: prayerTimes?.Fajr || '--:--' },
    { name: 'Dhuhr', time: prayerTimes?.Dhuhr || '--:--' },
    { name: 'Asr', time: prayerTimes?.Asr || '--:--' },
    { name: 'Maghrib', time: prayerTimes?.Maghrib || '--:--' },
    { name: 'Isha', time: prayerTimes?.Isha || '--:--' },
  ];

  // Dynamic Gregorian Date
  const now = new Date();
  const gregorianStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  
  // Dynamic Hijri Date using native Intl
  let hijriStr = '';
  try {
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    hijriStr = formatter.format(now);
    hijriStr = hijriStr.replace(' AH', '') + ' AH';
  } catch (e) {
    hijriStr = '';
  }

  const dateLine = hijriStr ? `${gregorianStr}  •  ${hijriStr}` : gregorianStr;

  // Next prayer time helper (covers all 6 items including Sunrise for next calculation)
  const fullPrayers = [
    { name: 'Fajr', time: prayerTimes?.Fajr || '--:--' },
    { name: 'Sunrise', time: prayerTimes?.Sunrise || '--:--' },
    { name: 'Dhuhr', time: prayerTimes?.Dhuhr || '--:--' },
    { name: 'Asr', time: prayerTimes?.Asr || '--:--' },
    { name: 'Maghrib', time: prayerTimes?.Maghrib || '--:--' },
    { name: 'Isha', time: prayerTimes?.Isha || '--:--' },
  ];
  const nextPrayerObject = fullPrayers.find(p => p.name === nextPrayerName);
  const nextPrayerTimeStr = nextPrayerObject ? nextPrayerObject.time.split(' ')[0] : '';

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundGradient: {
          from: '#0369a1', // Sky-700
          to: '#0f172a',   // Slate-900
          orientation: 'TL_BR',
        },
        borderRadius: 18,
        paddingLeft: 14,
        paddingRight: 14,
        paddingTop: 12,
        paddingBottom: 12,
        flexDirection: 'column',
        justifyContent: 'flex-start',
      }}
    >
      {/* Header Info */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
        }}
      >
        {/* Left Side: Meta Info */}
        <FlexWidget style={{ flexDirection: 'column', flex: 1.2 }}>
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextWidget
              text="Muslim Atlas"
              style={{
                fontSize: 19,
                color: '#ffffff',
                fontFamily: 'sans-serif-bold',
              }}
            />
            {/* Direct Refresh Widget Click Action Button */}
            <FlexWidget
              clickAction="REFRESH_WIDGET"
              style={{
                marginLeft: 6,
                padding: 4,
                borderRadius: 6,
                backgroundColor: '#ffffff1a',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <SvgWidget
                svg={refreshIconSvg}
                style={{ width: 11, height: 11 }}
              />
            </FlexWidget>
          </FlexWidget>
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
            <SvgWidget
              svg={locationPinSvg}
              style={{ width: 11, height: 11, marginRight: 4 }}
            />
            <TextWidget
              text={locationName}
              style={{
                fontSize: 12,
                color: '#e2e8f0', // Slate-200
                fontFamily: 'sans-serif-medium',
              }}
            />
          </FlexWidget>
          <TextWidget
            text={dateLine}
            style={{
              fontSize: 10,
              color: '#bae6fd', // Sky-200
              marginTop: 3,
            }}
          />
        </FlexWidget>
 
        {/* Right Side: Active Tracker & Details */}
        <FlexWidget style={{ flexDirection: 'column', alignItems: 'flex-end', flex: 0.8 }}>
          <TextWidget
            text={currentPrayerName || '---'}
            style={{
              fontSize: 26,
              color: '#ffffff', // Bright white active prayer name
              fontFamily: 'sans-serif-bold',
            }}
          />
          
          {nextPrayerName && nextPrayerTimeStr ? (
            <TextWidget
              text={`${nextPrayerName} at ${nextPrayerTimeStr}`}
              style={{
                fontSize: 10,
                color: '#bae6fd',
                marginTop: 1,
              }}
            />
          ) : null}

          {/* Sunrise Pill */}
          <FlexWidget
            style={{
              paddingTop: 2,
              paddingBottom: 2,
              paddingLeft: 6,
              paddingRight: 6,
              borderRadius: 6,
              backgroundColor: '#ffffff26', // rgba(255,255,255,0.15)
              marginTop: 3,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <SvgWidget
              svg={sunIconSvg}
              style={{ width: 9, height: 9, marginRight: 3 }}
            />
            <TextWidget
              text={`Sunrise ${prayerTimes?.Sunrise ? prayerTimes.Sunrise.split(' ')[0] : '--:--'}`}
              style={{
                fontSize: 9,
                color: '#ffffff',
                fontFamily: 'sans-serif-medium',
              }}
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>
 
      {/* Horizontal Line Divider */}
      <FlexWidget
        style={{
          height: 1,
          width: 'match_parent',
          backgroundColor: '#ffffff33',
          marginTop: 8,
          marginBottom: 8,
        }}
      />
 
      {/* Grid of 5 prayer times */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
        }}
      >
        {prayers.map((p, index) => {
          const isCurrent = p.name === currentPrayerName;
          return (
            <FlexWidget
              key={index}
              style={{
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: 6,
                paddingBottom: 6,
                paddingLeft: 2,
                paddingRight: 2,
                borderRadius: 10,
                flex: 1,
                marginLeft: 2,
                marginRight: 2,
                ...(isCurrent ? { backgroundColor: '#ffffff33' } : {}),
              }}
            >
              <TextWidget
                text={p.name}
                style={{
                  fontSize: 11,
                  color: isCurrent ? '#ffffff' : '#cbd5e1', // White vs Slate-300
                  textAlign: 'center',
                  fontFamily: 'sans-serif-bold',
                }}
              />
              <TextWidget
                text={p.time ? p.time.split(' ')[0] : '--:--'}
                style={{
                  fontSize: 15,
                  color: isCurrent ? '#ffffff' : '#f0f9ff', // White vs Sky-50
                  textAlign: 'center',
                  fontFamily: 'sans-serif-bold',
                  marginTop: 2,
                }}
              />
            </FlexWidget>
          );
        })}
      </FlexWidget>
    </FlexWidget>
  );
}
