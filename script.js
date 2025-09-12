class HotWheelsGenerator {
    constructor() {
        this.apiKey = ''; // Will be set by user
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const generateBtn = document.getElementById('generateBtn');
        generateBtn.addEventListener('click', () => this.generateCard());
    }

    async generateCard() {
        const carName = document.getElementById('carName').value.trim();
        const cardType = document.querySelector('input[name="cardType"]:checked').value;
        
        if (!carName) {
            alert('Please enter a car name');
            return;
        }

        if (!this.apiKey) {
            this.apiKey = prompt('Please enter your Gemini API key:');
            if (!this.apiKey) {
                alert('API key is required to generate cards');
                return;
            }
        }

        this.showLoading(true);
        
        try {
            const cardData = await this.generateCardData(carName, cardType);
            this.displayCard(cardData, cardType);
        } catch (error) {
            console.error('Error generating card:', error);
            this.showError('Failed to generate card. Please check your API key and try again.');
        } finally {
            this.showLoading(false);
        }
    }

    async generateCardData(carName, cardType) {
        const prompt = this.createPrompt(carName, cardType);
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return this.parseResponse(data, carName, cardType);
    }

    createPrompt(carName, cardType) {
        const isPremium = cardType === 'premium';
        const cardTypeText = isPremium ? 'Premium' : 'Mainline';
        
        return `Create a detailed Hot Wheels ${cardTypeText} card design for a "${carName}". 

Please provide a JSON response with the following structure:
{
    "carName": "${carName}",
    "cardType": "${cardTypeText}",
    "year": "2024",
    "series": "Custom Series",
    "number": "C-${Math.floor(Math.random() * 100)}",
    "description": "A detailed description of the car and its features",
    "specifications": {
        "scale": "1:64",
        "material": "${isPremium ? 'Die-cast metal with premium details' : 'Die-cast metal'}",
        "features": ["Realistic wheels", "Authentic paint job", "Detailed interior"],
        "collectorValue": "${isPremium ? 'High' : 'Standard'}"
    },
    "carImagePrompt": "A detailed 3D render of a ${carName} in Hot Wheels style, ${isPremium ? 'premium finish with metallic paint and detailed chrome accents' : 'classic Hot Wheels styling with bright colors'}, side view, die-cast toy car appearance",
    "blisterImagePrompt": "A Hot Wheels blister package containing the ${carName}, clear plastic blister with red and white Hot Wheels branding, ${isPremium ? 'gold premium packaging accents' : 'standard red and white packaging'}, product photography style"
}

Make the description exciting and appealing to collectors. Include specific details about the car's design, performance, and what makes it special. The car image prompt should describe a photorealistic 3D render suitable for a toy car. The blister image prompt should describe professional product photography of the packaged toy.`;
    }

    parseResponse(data, carName, cardType) {
        try {
            const responseText = data.candidates[0].content.parts[0].text;
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            } else {
                // Fallback if JSON parsing fails
                return this.createFallbackData(carName, cardType);
            }
        } catch (error) {
            console.error('Error parsing response:', error);
            return this.createFallbackData(carName, cardType);
        }
    }

    createFallbackData(carName, cardType) {
        const isPremium = cardType === 'premium';
        return {
            carName: carName,
            cardType: isPremium ? 'Premium' : 'Mainline',
            year: '2024',
            series: 'Custom Series',
            number: `C-${Math.floor(Math.random() * 100)}`,
            description: `A stunning ${carName} reimagined as a Hot Wheels die-cast car. This ${isPremium ? 'premium' : 'mainline'} edition features authentic styling and collector-quality details.`,
            specifications: {
                scale: '1:64',
                material: isPremium ? 'Die-cast metal with premium details' : 'Die-cast metal',
                features: ['Realistic wheels', 'Authentic paint job', 'Detailed interior'],
                collectorValue: isPremium ? 'High' : 'Standard'
            },
            carImagePrompt: `A detailed 3D render of a ${carName} in Hot Wheels style, ${isPremium ? 'premium finish with metallic paint and detailed chrome accents' : 'classic Hot Wheels styling with bright colors'}, side view, die-cast toy car appearance`,
            blisterImagePrompt: `A Hot Wheels blister package containing the ${carName}, clear plastic blister with red and white Hot Wheels branding, ${isPremium ? 'gold premium packaging accents' : 'standard red and white packaging'}, product photography style`
        };
    }

    async displayCard(cardData, cardType) {
        const resultSection = document.getElementById('resultSection');
        const cardContainer = document.getElementById('hotWheelsCard');
        
        // Generate images using Gemini's image generation
        const carImageUrl = await this.generateImage(cardData.carImagePrompt);
        const blisterImageUrl = await this.generateImage(cardData.blisterImagePrompt);
        
        const isPremium = cardType === 'premium';
        
        cardContainer.innerHTML = `
            <div class="card-header">
                <div class="${isPremium ? 'premium-badge' : 'mainline-badge'}">
                    ${isPremium ? 'Premium' : 'Mainline'}
                </div>
                <h2 class="card-title">${cardData.carName}</h2>
                <p class="card-subtitle">Hot Wheels ${cardData.cardType} • ${cardData.year}</p>
            </div>
            
            <div class="card-body">
                <div class="car-image">
                    ${carImageUrl ? 
                        `<img src="${carImageUrl}" alt="${cardData.carName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                         <div class="car-image-placeholder" style="display: none;">🚗 ${cardData.carName}</div>` :
                        `<div class="car-image-placeholder">🚗 ${cardData.carName}</div>`
                    }
                </div>
                
                <div class="card-details">
                    <div class="detail-row">
                        <span class="detail-label">Series:</span>
                        <span class="detail-value">${cardData.series}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Number:</span>
                        <span class="detail-value">${cardData.number}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Scale:</span>
                        <span class="detail-value">${cardData.specifications.scale}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Material:</span>
                        <span class="detail-value">${cardData.specifications.material}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Value:</span>
                        <span class="detail-value">${cardData.specifications.collectorValue}</span>
                    </div>
                </div>
                
                <p style="margin: 20px 0; color: #6c757d; line-height: 1.6;">
                    ${cardData.description}
                </p>
                
                <div class="blister-section">
                    <h3 class="blister-title">Blister Package</h3>
                    <div class="blister-image">
                        ${blisterImageUrl ? 
                            `<img src="${blisterImageUrl}" alt="Blister package" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                             <div class="car-image-placeholder" style="display: none;">📦 Blister Package</div>` :
                            `<div class="car-image-placeholder">📦 Blister Package</div>`
                        }
                    </div>
                </div>
            </div>
        `;
        
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    async generateImage(prompt) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Generate a detailed image prompt for: ${prompt}. Return only the enhanced prompt, no other text.`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 500,
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Image generation failed');
            }

            const data = await response.json();
            const enhancedPrompt = data.candidates[0].content.parts[0].text;
            
            // For now, we'll use a placeholder service or return null
            // In a real implementation, you'd use an image generation API
            return null; // Placeholder - would integrate with DALL-E, Midjourney, or similar
        } catch (error) {
            console.error('Error generating image:', error);
            return null;
        }
    }

    showLoading(show) {
        const generateBtn = document.getElementById('generateBtn');
        const btnText = generateBtn.querySelector('.btn-text');
        const spinner = generateBtn.querySelector('.loading-spinner');
        
        if (show) {
            generateBtn.disabled = true;
            btnText.style.display = 'none';
            spinner.style.display = 'block';
        } else {
            generateBtn.disabled = false;
            btnText.style.display = 'block';
            spinner.style.display = 'none';
        }
    }

    showError(message) {
        const resultSection = document.getElementById('resultSection');
        resultSection.innerHTML = `
            <div class="error-message">
                <strong>Error:</strong> ${message}
            </div>
        `;
        resultSection.style.display = 'block';
    }
}

// Initialize the generator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new HotWheelsGenerator();
});
