try:
    from .fatigue_engine import FatigueEngine
    from .config import FatigueConfig, config
except (ImportError, ValueError):
    from fatigue_engine import FatigueEngine
    from config import FatigueConfig, config

__all__ = ["FatigueEngine", "FatigueConfig", "config"]
