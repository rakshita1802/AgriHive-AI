// ================= Help & Support Tab (Quick Start Guide) =================
function HelpTab({ lang = "en" }) {
  const isTa = lang === "ta";
  const isHi = lang === "hi";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-leaf-900 to-leaf-800 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <span className="px-3 py-1 bg-leaf-700/80 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-leaf-100">
            {isTa ? "விவசாயி உதவி மையம்" : isHi ? "किसान सहायता केंद्र" : "Farmer & Cooperative Support Hub"}
          </span>
          <h2 className="text-2xl font-black">
            {isTa ? "அக்ரிஹைவ் AI — விரைவு வழிகாட்டி" : isHi ? "एग्रीहाइव एआई — त्वरित गाइड" : "AgriHive AI — Quick Start Guide & Support"}
          </h2>
          <p className="text-xs text-leaf-100 max-w-2xl leading-relaxed">
            {isTa
              ? "கூட்டு பண்ணை நுண்ணறிவு தளம் மூலம் உங்கள் பயிர் பாதுகாப்பு, நீர் மேலாண்மை மற்றும் மகசூல் கணிப்பை எளிதாக நிர்வகிக்கவும்."
              : isHi
                ? "सहयोगी कृषि बुद्धिमत्ता मंच के माध्यम से अपनी फसल सुरक्षा, जल प्रबंधन और उपज पूर्वानुमान को आसानी से प्रबंधित करें।"
                : "Welcome to AgriHive AI! Follow this step-by-step Quick Start Guide to set up your farm, sync field telemetry, and access collaborative AI insights."}
          </p>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-sand-200 space-y-4">
        <h3 className="text-base font-black text-ink-950 flex items-center gap-2 border-b border-sand-100 pb-3">
          <span className="w-7 h-7 rounded-lg bg-leaf-100 text-leaf-700 flex items-center justify-center font-bold text-xs">🚀</span>
          {isTa ? "விவசாயிகளுக்கான விரைவு வழிகாட்டி (Quick Start Guide)" : isHi ? "किसानों के लिए त्वरित गाइड (Quick Start Guide)" : "Quick Start Guide for Farmers & Field Officers"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-sand-50 rounded-xl border border-sand-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-extrabold text-sm">📍</div>
            <h4 className="font-extrabold text-xs text-ink-950">
              {isTa ? "1. பண்ணையைப் பதிவு செய்யவும்" : isHi ? "1. अपना खेत पंजीकृत करें" : "1. Register & Setup Your Farm"}
            </h4>
            <p className="text-[11px] text-ink-950/60 leading-normal">
              {isTa
                ? "புதிய விவசாயியாக முதல் முறை உள்நுழையும்போது உங்கள் பண்ணை பெயர், பயிர் மற்றும் மண் ஈரப்பதம் விவரங்களை உள்ளிடவும்."
                : isHi
                  ? "पहली बार नए किसान के रूप में लॉगिन करते समय अपना खेत का नाम, फसल और मृदा डेटा दर्ज करें।"
                  : "Enter your farm name, crop type, soil pH, moisture %, and temperature when logging in for the first time."}
            </p>
          </div>

          <div className="p-4 bg-sand-50 rounded-xl border border-sand-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-extrabold text-sm">🌤️</div>
            <h4 className="font-extrabold text-xs text-ink-950">
              {isTa ? "2. வானிலை தரவை புதுப்பிக்கவும்" : isHi ? "2. मौसम डेटा अपडेट करें" : "2. Sync Live Weather Data"}
            </h4>
            <p className="text-[11px] text-ink-950/60 leading-normal">
              {isTa
                ? "டாஷ்போர்டில் உள்ள 'Fetch Weather API' பட்டனை அழுத்தி நேரலை வெப்பநிலை, மழைப்பொழிவு மற்றும் ஈரப்பதத்தை பெறவும்."
                : isHi
                  ? "डैशबोर्ड पर 'Fetch Weather API' बटन दबाकर लाइव तापमान, वर्षा और आर्द्रता प्राप्त करें।"
                  : "Click 'Fetch Weather API' on the dashboard to pull real-time Open-Meteo and NASA POWER weather feeds."}
            </p>
          </div>

          <div className="p-4 bg-sand-50 rounded-xl border border-sand-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-leaf-100 text-leaf-700 flex items-center justify-center font-extrabold text-sm">🌱</div>
            <h4 className="font-extrabold text-xs text-ink-950">
              {isTa ? "3. கூட்டு AI ஆலோசனைகளைப் பெறவும்" : isHi ? "3. एआई सलाह प्राप्त करें" : "3. Get Collaborative AI Advice"}
            </h4>
            <p className="text-[11px] text-ink-950/60 leading-normal">
              {isTa
                ? "உங்கள் நிலத்தின் தரவு மற்றும் அருகிலுள்ள பண்ணைகளின் கூட்டுத் தரவு மூலம் உருவாக்கப்பட்டAI நீர் மேலாண்மை பரிந்துரைகளைப் பெறவும்."
                : isHi
                  ? "अपने खेत के डेटा और आसपास के खेतों के सामूहिक डेटा से उत्पन्न एआई सिफारिशें प्राप्त करें।"
                  : "Review PSO-optimized irrigation, NPK recommendations, and SHAP explainable factors tailored to your farm."}
            </p>
          </div>
        </div>
      </div>

      {/* Feature Modules Explanation & Contact Support */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-sand-200 space-y-3">
          <h3 className="font-extrabold text-sm text-ink-950 border-b border-sand-100 pb-2">
            {isTa ? "முக்கிய அம்சங்கள் & பயன்பாடு" : isHi ? "मुख्य विशेषताएं और उपयोग" : "Main System Modules"}
          </h3>
          <ul className="space-y-2.5 text-xs text-ink-950/70 font-medium">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-leaf-600 mt-1.5 shrink-0"></span>
              <div>
                <strong className="text-ink-950">{isTa ? "நேரலை டாஷ்போர்டு:" : isHi ? "लाइव डैशबोर्ड:" : "Live Dashboard:"}</strong>{" "}
                {isTa ? "பயிர் நோய் ஆபத்து, நீர் அழுத்தம் மற்றும் விளைச்சல் கணிப்பை நேரலையாகக் கண்காணிக்கிறது." : isHi ? "फसल रोग जोखिम, जल तनाव और उपज पूर्वानुमान की निगरानी करता है।" : "Tracks real-time disease risk, water stress, nutrient status, and yield predictions."}
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-leaf-600 mt-1.5 shrink-0"></span>
              <div>
                <strong className="text-ink-950">{isTa ? "கூகிள் சாட்டிலைட் மேப்:" : isHi ? "गूगल सैटेलाइट मैप:" : "Google Satellite Map:"}</strong>{" "}
                {isTa ? "பிராந்திய பண்ணைகளின் ஆபத்து நிலையை கூகிள் சாட்டிலைட் வரைபடத்தில் ஒப்பிட்டுப் பார்க்க உதவுகிறது." : isHi ? "गूगल सैटेलाइट मानचित्र पर सभी खेतों की जोखिम स्थिति दिखाता है।" : "Visualizes spatial risk distribution across neighboring regional farms using high-res Google Satellite imagery."}
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-leaf-600 mt-1.5 shrink-0"></span>
              <div>
                <strong className="text-ink-950">{isTa ? "டிஜிட்டல் இரட்டை (Digital Twin):" : isHi ? "डिजिटल ट्विन:" : "Digital Twin Simulator:"}</strong>{" "}
                {isTa ? "பண்ணையில் மாற்றங்களைச் செய்வதற்கு முன் விளைவுகளை முன்கூட்டியே கணிக்க உதவுகிறது." : isHi ? "खेत पर बदलाव करने से पहले परिणामों का अनुमान लगाने में मदद करता है।" : "Simulates management scenarios (irrigation, fertilizer, shading) before applying in the field."}
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-leaf-600 mt-1.5 shrink-0"></span>
              <div>
                <strong className="text-ink-950">{isTa ? "AI விளக்கக்காட்சி (XAI):" : isHi ? "एआई स्पष्टीकरण:" : "Explainable AI (SHAP):"}</strong>{" "}
                {isTa ? "AI பரிந்துரைகளுக்கான முக்கியக் காரணங்களை எளிமையான மொழியில் விளக்குகிறது." : isHi ? "एआई सिफारिशों के मुख्य कारणों को सरल भाषा में समझाता है।" : "Translates machine learning attributions into clear farmer-friendly explanations."}
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-sand-200 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h3 className="font-extrabold text-sm text-ink-950 border-b border-sand-100 pb-2 flex items-center gap-2">
              <span>📞</span>
              {isTa ? "உதவி & தொடர்பு" : isHi ? "सहायता और संपर्क" : "Need Direct Assistance?"}
            </h3>
            <p className="text-xs text-ink-950/70 leading-relaxed">
              {isTa
                ? "உங்கள் பண்ணை பதிவு அல்லது AI கணக்கீடுகள் குறித்து ஏதேனும் சந்தேகங்கள் இருந்தால் உங்கள் வேளாண் அலுவலர் அல்லது கூட்டுறவு மையத்தைத் தொடர்பு கொள்ளவும்."
                : isHi
                  ? "यदि आपके पास अपने खेत पंजीकरण या एआई गणना के बारे में प्रश्न हैं, तो अपने कृषि अधिकारी से संपर्क करें।"
                  : "If you need support registering your farm or updating field telemetry readings, contact your local Agricultural Officer or Cooperative Support Center."}
            </p>
          </div>

          <div className="p-4 bg-sand-50 rounded-xl border border-sand-200 space-y-1">
            <p className="text-[11px] font-extrabold text-ink-950 uppercase tracking-wider">AgriHive Cooperative Support</p>
            <p className="text-xs font-bold text-leaf-700">📧 support@agrihive.in • 📞 Toll Free: 9894106562</p>
          </div>
        </div>
      </div>
    </div>
  );
}
