import React, { useState, useEffect } from 'react';
import '../../styles/WageCalculator.css';

const WageCalculator = () => {
  // Rate type state
  const [rateType, setRateType] = useState('hourly');
  
  // Input states
  const [hourlyRate, setHourlyRate] = useState(23);
  const [dailyRate, setDailyRate] = useState(184);
  const [monthlyRate, setMonthlyRate] = useState(3986.67);
  const [annualSalary, setAnnualSalary] = useState(47840);
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [weeksPerYear, setWeeksPerYear] = useState(52);
  const [tax, setTax] = useState(20); // Tax percentage
  const [nationalInsurance, setNationalInsurance] = useState(12); // NI percentage
  const [showGross, setShowGross] = useState(true);
  const [showNet, setShowNet] = useState(true);
  
  // Results
  const [dailyWage, setDailyWage] = useState({ gross: 0, net: 0 });
  const [weeklyWage, setWeeklyWage] = useState({ gross: 0, net: 0 });
  const [monthlyWage, setMonthlyWage] = useState({ gross: 0, net: 0 });
  const [annualWage, setAnnualWage] = useState({ gross: 0, net: 0 });

  // Calculate wages when inputs change
  useEffect(() => {
    calculateWages();
  }, [
    rateType, 
    hourlyRate, 
    dailyRate, 
    monthlyRate, 
    annualSalary, 
    hoursPerDay, 
    daysPerWeek, 
    weeksPerYear, 
    tax, 
    nationalInsurance
  ]);

  const calculateWages = () => {
    let dailyGross = 0;
    let weeklyGross = 0;
    let monthlyGross = 0;
    let annualGross = 0;

    // Calculate gross wages based on rate type
    switch (rateType) {
      case 'hourly':
        dailyGross = hourlyRate * hoursPerDay;
        weeklyGross = dailyGross * daysPerWeek;
        monthlyGross = (weeklyGross * weeksPerYear) / 12;
        annualGross = weeklyGross * weeksPerYear;
        break;
      case 'daily':
        dailyGross = dailyRate;
        weeklyGross = dailyGross * daysPerWeek;
        monthlyGross = (weeklyGross * weeksPerYear) / 12;
        annualGross = weeklyGross * weeksPerYear;
        break;
      case 'monthly':
        monthlyGross = monthlyRate;
        annualGross = monthlyGross * 12;
        weeklyGross = annualGross / weeksPerYear;
        dailyGross = weeklyGross / daysPerWeek;
        break;
      case 'annual':
        annualGross = annualSalary;
        monthlyGross = annualGross / 12;
        weeklyGross = annualGross / weeksPerYear;
        dailyGross = weeklyGross / daysPerWeek;
        break;
      default:
        break;
    }
    
    // Calculate deductions
    const taxRate = tax / 100;
    const niRate = nationalInsurance / 100;
    
    // Calculate net wages (after tax and NI)
    const deductionRate = taxRate + niRate;
    const dailyNet = dailyGross * (1 - deductionRate);
    const weeklyNet = weeklyGross * (1 - deductionRate);
    const monthlyNet = monthlyGross * (1 - deductionRate);
    const annualNet = annualGross * (1 - deductionRate);
    
    // Update state with calculated values
    setDailyWage({ gross: dailyGross, net: dailyNet });
    setWeeklyWage({ gross: weeklyGross, net: weeklyNet });
    setMonthlyWage({ gross: monthlyGross, net: monthlyNet });
    setAnnualWage({ gross: annualGross, net: annualNet });

    // Sync rate values when changing rate type
    if (rateType === 'hourly') {
      setDailyRate(dailyGross);
      setMonthlyRate(monthlyGross);
      setAnnualSalary(annualGross);
    } else if (rateType === 'daily') {
      setHourlyRate(dailyGross / hoursPerDay);
      setMonthlyRate(monthlyGross);
      setAnnualSalary(annualGross);
    } else if (rateType === 'monthly') {
      setHourlyRate(dailyGross / hoursPerDay);
      setDailyRate(dailyGross);
      setAnnualSalary(annualGross);
    } else if (rateType === 'annual') {
      setHourlyRate(dailyGross / hoursPerDay);
      setDailyRate(dailyGross);
      setMonthlyRate(monthlyGross);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="wage-calculator-container">
      <h1 className="wage-calculator-title">Wage Calculator</h1>
      
      <div className="wage-calculator-grid">
        {/* Input Section */}
        <div className="wage-calculator-input-section">
          <h2 className="wage-calculator-section-heading">Input Details</h2>
          
          {/* Rate Type Selector */}
          <div className="wage-calculator-rate-type-selector">
            <label className="wage-calculator-label">Rate Type</label>
            <div className="wage-calculator-rate-buttons">
              <button
                onClick={() => setRateType('hourly')}
                className={`wage-calculator-rate-button ${rateType === 'hourly' ? 'active' : ''}`}
              >
                Hourly
              </button>
              <button
                onClick={() => setRateType('daily')}
                className={`wage-calculator-rate-button ${rateType === 'daily' ? 'active' : ''}`}
              >
                Daily
              </button>
              <button
                onClick={() => setRateType('monthly')}
                className={`wage-calculator-rate-button ${rateType === 'monthly' ? 'active' : ''}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setRateType('annual')}
                className={`wage-calculator-rate-button ${rateType === 'annual' ? 'active' : ''}`}
              >
                Annual
              </button>
            </div>
          </div>
          
          {/* Rate Input - Changes based on rate type */}
          <div className="wage-calculator-input-group">
            <label className="wage-calculator-label">
              {rateType === 'hourly' && 'Hourly Rate (£)'}
              {rateType === 'daily' && 'Daily Rate (£)'}
              {rateType === 'monthly' && 'Monthly Salary (£)'}
              {rateType === 'annual' && 'Annual Salary (£)'}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={
                rateType === 'hourly' 
                  ? hourlyRate 
                  : rateType === 'daily' 
                    ? dailyRate 
                    : rateType === 'monthly' 
                      ? monthlyRate 
                      : annualSalary
              }
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                if (rateType === 'hourly') setHourlyRate(value);
                else if (rateType === 'daily') setDailyRate(value);
                else if (rateType === 'monthly') setMonthlyRate(value);
                else if (rateType === 'annual') setAnnualSalary(value);
              }}
              className="wage-calculator-input"
            />
          </div>
          
          {/* Only show hours per day if not on monthly or annual salary */}
          {(rateType === 'hourly') && (
            <div className="wage-calculator-input-group">
              <label className="wage-calculator-label">Hours Per Day</label>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(parseFloat(e.target.value) || 0)}
                className="wage-calculator-input"
              />
            </div>
          )}
          
          {/* Show days per week for hourly and daily rates */}
          {(rateType === 'hourly' || rateType === 'daily') && (
            <div className="wage-calculator-input-group">
              <label className="wage-calculator-label">Days Per Week</label>
              <input
                type="number"
                min="0"
                max="7"
                step="0.5"
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(parseFloat(e.target.value) || 0)}
                className="wage-calculator-input"
              />
            </div>
          )}
          
          {/* Show weeks per year for hourly, daily and monthly rates */}
          {(rateType === 'hourly' || rateType === 'daily' || rateType === 'monthly') && (
            <div className="wage-calculator-input-group">
              <label className="wage-calculator-label">Weeks Per Year</label>
              <input
                type="number"
                min="0"
                max="52"
                step="1"
                value={weeksPerYear}
                onChange={(e) => setWeeksPerYear(parseFloat(e.target.value) || 0)}
                className="wage-calculator-input"
              />
            </div>
          )}
          
          <h3 className="wage-calculator-section-heading">Deductions</h3>
          
          <div className="wage-calculator-input-group">
            <label className="wage-calculator-label">Income Tax (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={tax}
              onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
              className="wage-calculator-input"
            />
          </div>
          
          <div className="wage-calculator-input-group">
            <label className="wage-calculator-label">National Insurance (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={nationalInsurance}
              onChange={(e) => setNationalInsurance(parseFloat(e.target.value) || 0)}
              className="wage-calculator-input"
            />
          </div>
          
          <div className="wage-calculator-checkbox-group">
            <div className="wage-calculator-checkbox-container">
              <input
                type="checkbox"
                id="showGross"
                checked={showGross}
                onChange={(e) => setShowGross(e.target.checked)}
                className="wage-calculator-checkbox"
              />
              <label htmlFor="showGross" className="wage-calculator-checkbox-label">Show Gross</label>
            </div>
            
            <div className="wage-calculator-checkbox-container">
              <input
                type="checkbox"
                id="showNet"
                checked={showNet}
                onChange={(e) => setShowNet(e.target.checked)}
                className="wage-calculator-checkbox"
              />
              <label htmlFor="showNet" className="wage-calculator-checkbox-label">Show Net</label>
            </div>
          </div>
        </div>
        
        {/* Results Section */}
        <div className="wage-calculator-results-section">
          <h2 className="wage-calculator-section-heading">Results</h2>
          
          <div className="wage-calculator-category">
            <h3 className="wage-calculator-category-heading">Daily Wage</h3>
            <div className="wage-calculator-results-grid">
              {showGross && (
                <div className="wage-calculator-result-card gross">
                  <div className="wage-calculator-result-label">Gross</div>
                  <div className="wage-calculator-result-value">{formatCurrency(dailyWage.gross)}</div>
                </div>
              )}
              {showNet && (
                <div className="wage-calculator-result-card net">
                  <div className="wage-calculator-result-label">Net</div>
                  <div className="wage-calculator-result-value">{formatCurrency(dailyWage.net)}</div>
                </div>
              )}
            </div>
          </div>
          
          <div className="wage-calculator-category">
            <h3 className="wage-calculator-category-heading">Weekly Wage</h3>
            <div className="wage-calculator-results-grid">
              {showGross && (
                <div className="wage-calculator-result-card gross">
                  <div className="wage-calculator-result-label">Gross</div>
                  <div className="wage-calculator-result-value">{formatCurrency(weeklyWage.gross)}</div>
                </div>
              )}
              {showNet && (
                <div className="wage-calculator-result-card net">
                  <div className="wage-calculator-result-label">Net</div>
                  <div className="wage-calculator-result-value">{formatCurrency(weeklyWage.net)}</div>
                </div>
              )}
            </div>
          </div>
          
          <div className="wage-calculator-category">
            <h3 className="wage-calculator-category-heading">Monthly Wage</h3>
            <div className="wage-calculator-results-grid">
              {showGross && (
                <div className="wage-calculator-result-card gross">
                  <div className="wage-calculator-result-label">Gross</div>
                  <div className="wage-calculator-result-value">{formatCurrency(monthlyWage.gross)}</div>
                </div>
              )}
              {showNet && (
                <div className="wage-calculator-result-card net">
                  <div className="wage-calculator-result-label">Net</div>
                  <div className="wage-calculator-result-value">{formatCurrency(monthlyWage.net)}</div>
                </div>
              )}
            </div>
          </div>
          
          <div className="wage-calculator-category">
            <h3 className="wage-calculator-category-heading">Annual Wage</h3>
            <div className="wage-calculator-results-grid">
              {showGross && (
                <div className="wage-calculator-result-card gross">
                  <div className="wage-calculator-result-label">Gross</div>
                  <div className="wage-calculator-result-value">{formatCurrency(annualWage.gross)}</div>
                </div>
              )}
              {showNet && (
                <div className="wage-calculator-result-card net">
                  <div className="wage-calculator-result-label">Net</div>
                  <div className="wage-calculator-result-value">{formatCurrency(annualWage.net)}</div>
                </div>
              )}
            </div>
          </div>
          
          <div className="wage-calculator-disclaimer">
            <p>Note: This is a simplified calculation. Actual tax rates may vary based on income thresholds, personal allowances, and other factors.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WageCalculator;