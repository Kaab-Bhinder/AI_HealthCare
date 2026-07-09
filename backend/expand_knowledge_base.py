#!/usr/bin/env python3
"""
Script to expand the medical knowledge base with additional conditions
Run this script to add more diseases and conditions to your knowledge base
"""

import json
import os
from datetime import datetime

# Comprehensive medical knowledge database
MEDICAL_CONDITIONS = {
    "diabetes": {
        "title": "Diabetes: Types, Symptoms, and Management",
        "content": "Diabetes is a chronic condition affecting blood sugar levels. Type 1 diabetes is autoimmune; Type 2 is metabolic. Symptoms include increased thirst, frequent urination, fatigue, blurred vision, and slow wound healing. Type 1 requires insulin therapy. Type 2 management includes diet, exercise, and medications like metformin. Blood glucose monitoring is essential. Prevent complications through blood sugar control, regular exercise, healthy diet, and regular check-ups. Complications include neuropathy, nephropathy, and retinopathy. Seek immediate care for blood sugar extremes."
    },
    "hypertension": {
        "title": "Hypertension (High Blood Pressure): Control and Prevention",
        "content": "Hypertension is elevated blood pressure (≥130/80 mmHg). Often asymptomatic, it increases heart disease and stroke risk. Causes include lifestyle factors, genetics, and underlying conditions. Management includes sodium reduction, weight loss, regular exercise, stress management, and limit alcohol. Medications like ACE inhibitors, beta-blockers, or diuretics help. Monitor blood pressure regularly. Lifestyle changes are first-line treatment. Avoid smoking. Maintain healthy diet rich in potassium and calcium. Regular monitoring and medication adherence prevent complications."
    },
    "asthma": {
        "title": "Asthma: Triggers, Symptoms, and Control",
        "content": "Asthma is a chronic inflammatory airway disease causing breathing difficulty. Symptoms include wheezing, shortness of breath, chest tightness, and coughing (especially at night). Common triggers include allergens, exercise, cold air, stress, and pollutants. Management includes identifying triggers, using inhalers (controller and rescue), peak flow monitoring, and action plans. Keep rescue inhalers accessible. Regular exercise improves lung function. Allergy management helps if allergen-triggered. Monitor symptoms daily. Seek emergency care for severe attacks with difficulty speaking or blue lips."
    },
    "arthritis": {
        "title": "Arthritis: Types and Joint Pain Management",
        "content": "Arthritis involves joint inflammation causing pain, stiffness, and reduced mobility. Osteoarthritis (degenerative) results from wear and tear. Rheumatoid arthritis is autoimmune. Management includes rest, ice/heat therapy, exercises, weight management, and anti-inflammatory medications. Physical therapy maintains mobility. Heat therapy relieves stiffness; cold reduces swelling. NSAIDs like ibuprofen help. Biologic medications help rheumatoid arthritis. Maintain healthy weight to reduce joint stress. Regular gentle exercise prevents stiffness. Advanced cases may require joint replacement."
    },
    "anxiety": {
        "title": "Anxiety Disorders: Symptoms and Treatment",
        "content": "Anxiety disorders involve excessive worry, fear, or panic. Types include generalized anxiety, panic disorder, social anxiety, and phobias. Symptoms include rapid heartbeat, sweating, trembling, shortness of breath, and restlessness. Treatment includes therapy (CBT is highly effective), medications (SSRIs), lifestyle changes, and stress management. Relaxation techniques like deep breathing and meditation help. Regular exercise reduces anxiety. Limit caffeine and alcohol. Maintain regular sleep schedule. Seek professional help if anxiety interferes with daily functioning."
    },
    "depression": {
        "title": "Depression: Recognition and Management",
        "content": "Depression is a mood disorder characterized by persistent sadness, loss of interest, and hopelessness. Symptoms include fatigue, sleep changes, appetite changes, difficulty concentrating, and suicidal thoughts. Risk factors include genetics, trauma, stress, and medical conditions. Treatment includes therapy (CBT, psychotherapy), medications (SSRIs, SNRIs), lifestyle changes, and support. Regular exercise, adequate sleep, healthy diet, and social connection help. Never ignore suicidal thoughts - seek emergency help immediately. Professional evaluation is essential for proper diagnosis and treatment."
    },
    "migraines": {
        "title": "Migraines: Triggers, Symptoms, and Relief",
        "content": "Migraines are severe headaches often one-sided, throbbing, lasting 4-72 hours. May include aura (visual disturbances), nausea, and light sensitivity. Triggers include hormonal changes, stress, certain foods, sleep changes, and weather. Prevention includes identifying triggers, maintaining sleep schedule, stress management, and preventive medications. Relief includes dark quiet rest, cold/warm compress, hydration, and pain medications. Some find relief with caffeine. Preventive medications include beta-blockers or topiramate. Keep a migraine diary to identify patterns."
    },
    "thyroid": {
        "title": "Thyroid Disorders: Hypothyroidism and Hyperthyroidism",
        "content": "Thyroid disorders affect metabolism and energy. Hypothyroidism (underactive): causes fatigue, weight gain, cold sensitivity, and depression. Hyperthyroidism (overactive): causes weight loss, anxiety, rapid heartbeat, heat sensitivity. Hashimoto's disease and Graves' disease are common causes. Management includes thyroid hormone replacement for hypothyroidism and anti-thyroid drugs or radioactive iodine for hyperthyroidism. Regular TSH monitoring ensures proper medication levels. Selenium and iodine support thyroid health. Symptoms improve with proper treatment."
    },
    "pneumonia": {
        "title": "Pneumonia: Bacterial, Viral, and Fungal Infections",
        "content": "Pneumonia is lung infection causing inflammation and fluid buildup. Bacterial pneumonia (common, serious) requires antibiotics. Viral pneumonia (often from influenza) is self-limiting. Symptoms include cough, fever, chest pain, shortness of breath, and chills. Risk groups include elderly, young children, and immunocompromised. Treatment includes antibiotics, supportive care, rest, fluids, and oxygen if needed. Prevention includes vaccines (pneumococcal, flu), handwashing, and avoiding smoke. Seek urgent care for high fever, difficulty breathing, or persistent symptoms."
    },
    "uti": {
        "title": "Urinary Tract Infections (UTI): Causes and Treatment",
        "content": "UTIs occur when bacteria infect urinary system. Symptoms include painful urination, frequency, urgency, cloudy urine, and lower abdominal pain. Women are more commonly affected. Causes include poor hygiene, sexual activity, urinary retention, and catheter use. Treatment includes antibiotics (first-line). Prevention includes hydration, regular urination, proper hygiene, and urinating after intercourse. Cranberry supplements may help prevention. Untreated UTIs can progress to kidney infection. Seek care for fever, back pain, or vomiting with UTI symptoms."
    },
    "bronchitis": {
        "title": "Bronchitis: Acute and Chronic Respiratory Infection",
        "content": "Acute bronchitis involves airway inflammation from viral infection, lasting weeks. Symptoms include persistent cough, mucus production, fatigue, and chest discomfort. Often follows cold/flu. Treatment is supportive: rest, fluids, cough medicine, and decongestants. Antibiotics don't help viral cases. Chronic bronchitis is COPD involving persistent cough and mucus. Prevention includes avoiding smoke and pollutants. Use humidifier for moisture. Seek care if cough lasts beyond 3 weeks, produces blood, or causes difficulty breathing."
    },
    "gastroenteritis": {
        "title": "Gastroenteritis (Stomach Flu): Food Poisoning and Stomach Viruses",
        "content": "Gastroenteritis involves stomach/intestine inflammation from viral or bacterial infection. Symptoms include diarrhea, vomiting, stomach cramps, and fever. Usually self-limiting, lasting 1-3 days. Treatment is supportive: rest, clear fluids, electrolyte solutions, bland diet. Avoid dairy, fiber, and fatty foods. Handwashing prevents spread. Most cases don't need antibiotics unless bacterial. Severe dehydration requires medical care. Seek emergency care for severe dehydration signs, bloody stools, or high fever."
    },
    "anemia": {
        "title": "Anemia: Iron Deficiency and Blood Cell Disorders",
        "content": "Anemia occurs when red blood cells are insufficient for oxygen transport. Iron deficiency anemia is most common from poor diet, blood loss, or absorption issues. Symptoms include fatigue, weakness, shortness of breath, and dizziness. Other types include vitamin B12 deficiency and hemolytic anemia. Treatment depends on type: iron supplements, B12 injections, or addressing underlying causes. Dietary sources include red meat, leafy greens, and legumes. Regular monitoring ensures adequate levels. Severe cases may require transfusion."
    },
    "eczema": {
        "title": "Eczema (Atopic Dermatitis): Skin Irritation and Relief",
        "content": "Eczema is chronic inflammatory skin condition causing itching, dryness, and redness. Often begins in childhood but can occur at any age. Triggers include soaps, detergents, stress, weather, and allergens. Management includes moisturizing frequently, using mild cleansers, avoiding triggers, and minimizing scratching. Topical corticosteroids reduce inflammation. Antihistamines help itching. Keep nails short to prevent damage from scratching. Humidifiers help. Severe cases may need phototherapy or systemic medications. Proper skincare routine is essential."
    },
    "psoriasis": {
        "title": "Psoriasis: Autoimmune Skin Condition",
        "content": "Psoriasis is autoimmune condition causing thick, scaly skin plaques. Often on elbows, knees, scalp, and nails. Triggers include stress, infections, medications, and weather. Treatments include topical corticosteroids, vitamin D analogs, calcineurin inhibitors, and phototherapy. Systemic medications help severe cases. Moisturizing soothes skin. Stress management is important. UV therapy (controlled) helps. Nail involvement requires special attention. No cure, but remission is possible. Biologics target immune system effectively."
    },
    "acne": {
        "title": "Acne: Causes, Prevention, and Treatment",
        "content": "Acne involves clogged pores, bacteria, inflammation causing pustules and blackheads. Hormones, excess oil, bacteria, and follicle blockage cause it. Common in teens but affects all ages. Treatment includes gentle washing, non-comedogenic products, benzoyl peroxide, salicylic acid, retinoids, and antibiotics. Oral contraceptives help hormonal acne. Severe cases need isotretinoin. Avoid touching face, minimize picking, use oil-free products, and manage stress. Diet modifications (reducing dairy/high-glycemic foods) may help. Consistency in routine matters."
    },
    "cellulitis": {
        "title": "Cellulitis: Bacterial Skin Infection",
        "content": "Cellulitis is acute bacterial skin infection causing redness, warmth, swelling, and pain. Often streptococcal or staphylococcal. Entry points include cuts, insect bites, or surgical wounds. Symptoms progress rapidly. Treatment requires oral or IV antibiotics depending on severity. Elevate affected area. Apply warm compresses. Pain management with acetaminophen or ibuprofen. Keep area clean and dry. Prevent by maintaining skin integrity, treating wounds promptly, and managing predisposing conditions. Seek care immediately for rapid spread or systemic symptoms."
    },
    "migraine_preventive": {
        "title": "Migraine Prevention Strategies",
        "content": "Preventing migraines involves lifestyle changes and medications. Identify and avoid triggers (food, stress, sleep changes, hormones). Maintain consistent sleep schedule. Regular exercise (avoid overexertion). Stress management through relaxation. Proper hydration. Limited caffeine. Preventive medications include beta-blockers, tricyclic antidepressants, anticonvulsants, or CGRP inhibitors. Biofeedback and relaxation training help. Magnesium and riboflavin supplements show promise. Keep headache diary to track patterns. Working with healthcare provider optimizes prevention."
    },
    "gerd": {
        "title": "GERD (Acid Reflux): Heartburn Management",
        "content": "GERD occurs when stomach acid backs into esophagus, causing heartburn and discomfort. Triggers include fatty foods, spicy foods, chocolate, caffeine, alcohol, large meals, and lying down after eating. Symptoms include heartburn, regurgitation, dysphagia, and chronic cough. Management includes elevating head while sleeping, avoiding trigger foods, eating smaller meals, not eating before bed, and weight management. Antacids, H2 blockers, and PPIs reduce acid. Lifestyle modifications are first-line. Persistent symptoms need evaluation for complications."
    },
    "kidney_stones": {
        "title": "Kidney Stones: Prevention and Pain Management",
        "content": "Kidney stones form from mineral crystals in kidneys, causing severe pain when passing. Symptoms include flank pain, hematuria, nausea, and urinary symptoms. Risk factors include dehydration, diet (high sodium, protein, oxalate), genetics, and medical conditions. Prevention includes hydration (clear urine indicates good hydration), dietary modifications, and medications. Small stones pass spontaneously with pain management. Larger stones may need medical intervention. Treatment includes NSAIDs, hydration, and sometimes surgical removal. Adequate hydration is best prevention."
    },
    "menopause": {
        "title": "Menopause: Hormonal Transition and Symptom Management",
        "content": "Menopause marks end of menstruation, typically around age 50. Perimenopause (transition) lasts 4-10 years with irregular periods. Symptoms include hot flashes, night sweats, mood changes, sleep problems, vaginal dryness, and weight changes. Hormone replacement therapy (HRT) helps symptoms but carries risks. Non-hormonal options include SSRIs, SNRIs, clonidine, or gabapentin. Lifestyle: regular exercise, stress management, adequate sleep, cool environment. Phytoestrogens (soy, flax) may help. Bone density monitoring important due to osteoporosis risk."
    },
    "osteoporosis": {
        "title": "Osteoporosis: Bone Health and Fracture Prevention",
        "content": "Osteoporosis is decreased bone density increasing fracture risk. Often asymptomatic until fracture occurs. Risk factors include age, female gender, low calcium/vitamin D, sedentary lifestyle, smoking, and alcohol. Prevention includes calcium intake (1000-1200 mg daily), vitamin D (600-800 IU), weight-bearing exercise, and avoiding smoking/excess alcohol. Medications include bisphosphonates. Bone density screening (DEXA) at age 65 for women and 70 for men. Early intervention prevents fractures and disability."
    },
    "gout": {
        "title": "Gout: Uric Acid Buildup and Joint Pain",
        "content": "Gout is form of arthritis from uric acid crystal buildup in joints, commonly affecting big toe. Acute attacks involve intense pain, swelling, and redness. Triggers include purine-rich foods (red meat, seafood, alcohol), dehydration, and rapid weight loss. Treatment for acute attacks includes NSAIDs, colchicine, or corticosteroids. Long-term management includes urate-lowering medications (allopurinol). Dietary changes: limit purines, alcohol (especially beer), and fructose. Hydration helps prevent attacks. Regular monitoring of uric acid levels."
    },
    "copd": {
        "title": "COPD: Chronic Obstructive Pulmonary Disease",
        "content": "COPD includes emphysema and chronic bronchitis causing progressive airway obstruction. Main cause is smoking. Symptoms include chronic cough, shortness of breath, mucus production, and wheezing. Smoking cessation is critical. Medications include bronchodilators and corticosteroid inhalers. Pulmonary rehabilitation improves function. Oxygen therapy in advanced stages. Vaccinations (flu, pneumococcal) prevent infections. Avoid air pollutants. Regular exercise improves capacity. Exacerbations require prompt medical treatment. Early diagnosis and management slow progression."
    },
    "whooping_cough": {
        "title": "Whooping Cough (Pertussis): Prevention and Treatment",
        "content": "Pertussis is bacterial respiratory infection causing severe cough paroxysms with characteristic 'whoop'. Highly contagious. Vaccination (DTaP/Tdap) prevents disease. In vaccinated individuals, symptoms milder. Treatment includes macrolide antibiotics (azithromycin) if started early. Supportive care: cough management, nutrition, hydration. Monitor for complications (pneumonia, seizures). Infants most at risk for complications. Close contacts need prophylaxis. Disease reportable to health authorities. Vaccination during pregnancy protects newborns."
    },
    "measles": {
        "title": "Measles: Prevention Through Vaccination",
        "content": "Measles is highly contagious viral disease with fever, cough, coryza, conjunctivitis, and Koplik spots preceding characteristic rash. MMR vaccine prevents disease. Unvaccinated individuals at high risk. Treatment is supportive: rest, fluids, fever management, and vitamin A supplementation. Complications include pneumonia, encephalitis. Immunocompromised individuals at severe risk. Disease is reportable. Isolation prevents spread. Post-exposure vaccination within 72 hours helps. Vaccination mandatory in most schools."
    },
    "chickenpox": {
        "title": "Chickenpox (Varicella): Symptoms and Complications",
        "content": "Chickenpox is viral infection with fever and characteristic blister rash. Highly contagious. Varicella vaccine prevents disease. Treatment is supportive: fever management, calamine lotion, gentle bathing. Avoid scratching to prevent scarring. Antivirals (acyclovir) help if started early, especially in severe cases or high-risk individuals. Complications include bacterial superinfection, pneumonia, encephalitis. Immunocompromised and pregnant individuals at high risk. Once infected, lifelong immunity develops but shingles (reactivation) possible later."
    },
    "shingles": {
        "title": "Shingles (Herpes Zoster): Reactivation and Pain Management",
        "content": "Shingles results from varicella-zoster virus reactivation causing painful vesicular rash along dermatome. Preceded by pain, tingling, or numbness. Antiviral medications (acyclovir, valacyclovir) effective if started within 72 hours. Pain management includes acetaminophen, NSAIDs, topical capsaicin, or gabapentin. Postherpetic neuralgia (persistent pain) affects many, treatable with medications. Shingles vaccine (Shingrix) prevents disease in older adults. Isolate fluid-containing lesions. Complications include vision loss if affects eye."
    },
    "mono": {
        "title": "Infectious Mononucleosis (Mono): Viral Infection",
        "content": "Mono is viral infection from Epstein-Barr virus causing fever, sore throat, lymphadenopathy, and fatigue. Spread through saliva. Symptoms develop over weeks and last weeks to months. Treatment is supportive: rest, fluids, throat lozenges, fever management. NSAIDs help pain and fever. Avoid contact sports during acute illness due to splenomegaly risk. Antibiotics ineffective for viral infection. Symptoms gradually improve. Return to normal activities gradual. Severe cases or complicated mononucleosis needs hospitalization."
    },
    "herpes": {
        "title": "Herpes Simplex: Cold Sores and Management",
        "content": "Herpes simplex virus (HSV) causes recurrent blisters on lips or genitals. Initial infection often asymptomatic or mild. Triggers include stress, immunity, UV exposure, or illness. Antiviral medications (acyclovir, valacyclovir) shorten duration if started early. Topical treatments reduce symptoms. Keep lesions clean and dry. Avoid touching and spreading virus. Don't share personal items. Sexual transmission possible during shedding. Regular suppressive therapy for frequent recurrences. No cure, but management reduces impact."
    },
    "scabies": {
        "title": "Scabies: Mite Infestation and Treatment",
        "content": "Scabies is contagious skin infestation from Sarcoptes mite causing intense itching, especially at night. Burrows and rash visible on hands, wrists, genitals, and skin folds. Treatment includes topical scabicides (permethrin, sulfur) applied to entire body. Oral ivermectin for severe or crusted scabies. Wash all clothing and bedding in hot water. Treat all household members simultaneously. Symptoms persist 2-4 weeks after treatment. Avoid skin-to-skin contact during treatment. Sexual partners need treatment. Good personal hygiene prevents transmission."
    },
    "ringworm": {
        "title": "Ringworm (Tinea): Fungal Skin Infection",
        "content": "Ringworm is contagious fungal infection (not a worm) causing ring-shaped rash on skin or scalp. Spread through contact or contaminated items. Symptoms vary by location. Scalp ringworm more common in children. Treatment includes topical antifungals (clotrimazole, miconazole) for localized infection. Oral antifungals (griseofulvin, terbinafine) for scalp or severe cases. Keep area clean and dry. Avoid scratching/spreading. Launder clothing/items. Prevent spread to others. Professional confirmation of diagnosis important."
    },
    "candida": {
        "title": "Yeast Infection (Candida): Fungal Overgrowth",
        "content": "Candida overgrowth causes vaginal yeast infections, oral thrush, or skin infections. Risk factors include antibiotics, diabetes, HIV, or weak immunity. Vaginal symptoms: itching, discharge, burning. Oral: white patches, soreness. Treatment includes topical or oral antifungals (fluconazole). Prevent through probiotics, proper hygiene, and treating underlying conditions. Wear breathable clothing. Avoid irritants. Diabetes management important. Recurrent infections warrant investigation of underlying causes. Over-the-counter treatments effective for initial episodes."
    },
    "lice": {
        "title": "Lice Infestation: Head Lice Treatment and Prevention",
        "content": "Head lice are parasitic insects causing itching and visible nits (eggs) on hair shafts. Spread through direct contact or shared items. Treatment with pediculicide shampoos (pyrethrin or permethrin) applied per instructions. Nit combing removes eggs. Wash all items in hot water, seal others in bags for 2 weeks. Treat household members and close contacts. Repeat treatment at 7-10 days if needed. School notification required. Prescription options for resistant cases. Prevention through avoiding shared grooming items."
    },
    "hives": {
        "title": "Hives (Urticaria): Allergic Reaction",
        "content": "Hives are raised, itchy welts from allergic reaction or mast cell release. Causes include food allergies, medications, insect stings, or allergen contact. Acute hives resolve within 24 hours typically. Chronic hives (>6 weeks) require investigation. Treatment includes antihistamines (diphenhydramine, cetirizine). Avoid triggers once identified. Cool compress helps itching. Avoid scratching. Severe cases need corticosteroids. Epinephrine for anaphylaxis. Identify and eliminate triggers. Hypoallergenic products help sensitive skin."
    },
    "sunburn": {
        "title": "Sunburn: Prevention and Relief",
        "content": "Sunburn is skin inflammation from UV radiation exposure. Prevention is primary: use SPF 30+ sunscreen, reapply every 2 hours, wear protective clothing, seek shade 10am-4pm. Symptoms include redness, pain, and peeling. Treatment includes cool compress, aloe vera, hydration, and NSAIDs. Avoid petroleum jelly. Don't pick peeling skin. Serious burns (blistering, fever) need medical attention. Cumulative sun exposure increases skin cancer risk. Prevent premature aging through consistent sun protection."
    }
}

def expand_knowledge_base():
    """Add new medical conditions to the knowledge base"""
    kb_path = os.path.join(os.path.dirname(__file__), 'knowledge_base', 'documents.json')
    
    # Load existing knowledge base
    with open(kb_path, 'r') as f:
        knowledge_base = json.load(f)
    
    # Add new documents
    for key, doc_info in MEDICAL_CONDITIONS.items():
        doc_id = f"medical_{len(knowledge_base):03d}_{key}"
        knowledge_base[doc_id] = {
            "title": doc_info["title"],
            "content": doc_info["content"],
            "source": "medical_guidelines",
            "timestamp": datetime.now().isoformat()
        }
    
    # Save updated knowledge base
    with open(kb_path, 'w') as f:
        json.dump(knowledge_base, f, indent=2)
    
    print(f"✅ Knowledge base expanded!")
    print(f"📚 Added {len(MEDICAL_CONDITIONS)} new medical conditions")
    print(f"📊 Total documents now: {len(knowledge_base)}")
    print(f"💾 Saved to: {kb_path}")

if __name__ == "__main__":
    expand_knowledge_base()
