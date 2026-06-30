import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigationRegistry } from '../core/plugins/NavigationRegistry';
import { GLOBAL_ROUTE_REGISTRY } from '../core/config/searchRegistry';
import { useTheme } from '../core/context/ThemeContext';

const PlatformNavbar = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const products = navigationRegistry.getNavbarProducts();
  const { theme, toggleTheme } = useTheme();

  // Search Engine State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchContainerRef = useRef(null);

  // Compute Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    
    return GLOBAL_ROUTE_REGISTRY.filter(item => {
      const matchName = item.name.toLowerCase().includes(query);
      const matchKeywords = item.keywords.some(kw => kw.toLowerCase().includes(query));
      return matchName || matchKeywords;
    }).slice(0, 8); // limit results for clean UI
  }, [searchQuery]);

  // Handle click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Keyboard Navigation
  const handleKeyDown = (e) => {
    if (!isSearchFocused || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = searchResults[selectedIndex];
      if (selected) {
        navigate(selected.path);
        setSearchQuery('');
        setIsSearchFocused(false);
        e.target.blur();
      }
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
      e.target.blur();
    }
  };

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'trading': return '📈';
      case 'ai': return '🤖';
      case 'analytics': return '📊';
      case 'reports': return '📑';
      case 'news': return '📰';
      case 'wallet': return '💼';
      case 'insights': return '💡';
      case 'backtest': return '⏳';
      default: return '✨';
    }
  };

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 32px',
      backgroundColor: 'var(--card-bg)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--glass-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        {/* Logo */}
        <div 
          onClick={() => navigate('/')}
          style={{ 
            fontSize: '24px', 
            fontWeight: '800', 
            color: 'var(--text-primary)', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            letterSpacing: '-0.025em'
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '18px'
          }}>
            ₿
          </div>
          BTCUSD
        </div>

        {/* Products Dropdown */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--glass-border)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Products
            <span style={{ fontSize: '10px', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              ▼
            </span>
          </button>

          {isDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '8px',
              width: '600px',
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
              padding: '16px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              zIndex: 101
            }}>
              {products.map(product => (
                <div 
                  key={product.id}
                  onClick={() => {
                    if (product.enabled && !product.comingSoon) {
                      navigate(product.route);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '12px',
                    cursor: (product.enabled && !product.comingSoon) ? 'pointer' : 'not-allowed',
                    transition: 'background-color 0.2s',
                    opacity: (!product.enabled || product.comingSoon) ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (product.enabled && !product.comingSoon) {
                      e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (product.enabled && !product.comingSoon) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ fontSize: '24px', backgroundColor: 'var(--glass-border)', padding: '8px', borderRadius: '8px' }}>
                    {getIcon(product.icon)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '14px' }}>{product.name}</span>
                      {product.badge && (
                        <span style={{ fontSize: '9px', backgroundColor: '#3b82f6', color: '#fff', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                          {product.badge}
                        </span>
                      )}
                      {product.comingSoon && (
                        <span style={{ fontSize: '9px', backgroundColor: '#475569', color: '#cbd5e1', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                          Soon
                        </span>
                      )}
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginTop: '4px', lineHeight: '1.4' }}>
                      {product.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Search */}
        <div style={{ position: 'relative' }} ref={searchContainerRef}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#64748b', zIndex: 2 }}>🔍</span>
          <input 
            type="text" 
            placeholder="Search products or features..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              backgroundColor: 'var(--bg-color)',
              border: '1px solid var(--glass-border)',
              borderRadius: '20px',
              padding: '8px 16px 8px 36px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              width: isSearchFocused ? '300px' : '200px',
              transition: 'all 0.2s',
              position: 'relative',
              zIndex: 2
            }}
            onFocus={(e) => {
              setIsSearchFocused(true);
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.backgroundColor = 'var(--card-bg)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--glass-border)';
              e.currentTarget.style.backgroundColor = 'var(--bg-color)';
            }}
          />

          {/* Omnibox Dropdown */}
          {isSearchFocused && searchQuery.trim() && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '300px',
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              zIndex: 101,
              display: 'flex',
              flexDirection: 'column'
            }}>
              {searchResults.length > 0 ? (
                searchResults.map((result, index) => (
                  <div
                    key={`${result.path}-${index}`}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => {
                      navigate(result.path);
                      setSearchQuery('');
                      setIsSearchFocused(false);
                    }}
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      backgroundColor: index === selectedIndex ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      borderLeft: index === selectedIndex ? '3px solid #3b82f6' : '3px solid transparent',
                      transition: 'background-color 0.1s'
                    }}
                  >
                    <span style={{ color: index === selectedIndex ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '14px', fontWeight: index === selectedIndex ? '600' : '500' }}>
                      {result.name}
                    </span>
                    <span style={{ 
                      fontSize: '10px', 
                      backgroundColor: result.type === 'product' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: result.type === 'product' ? '#3b82f6' : '#10b981',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      fontWeight: 'bold'
                    }}>
                      {result.type}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  No matching modules found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          style={{
          background: 'var(--bg-color)',
          border: '1px solid var(--glass-border)',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--glass-border)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
        >
          {theme === 'light' ? '☀️' : '🌙'}
        </button>

        {/* Profile */}
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
          cursor: 'pointer',
          border: '2px solid rgba(255, 255, 255, 0.1)'
        }}>
          US
        </div>
      </div>
    </nav>
  );
};

export default PlatformNavbar;
